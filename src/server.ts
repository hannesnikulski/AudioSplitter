import fs from 'fs'
import http from 'http'
import path from 'path'
import { Server, Socket } from 'socket.io'
import { exec, spawn } from 'child_process'

import { Metadata, Point } from './lib/types'
import { port } from './lib/socket'
import { readJSONIfExists } from './lib/config'

// supported audio formats
type AudioFormat = 'wav' | 'opus' | 'mp3'

// create http & websocket server
const httpServer = http.createServer()
const io = new Server(httpServer, {
    cors: { origin: '*' }, // for developement
})

// filepaths
const metadataPath = path.join(process.cwd(), 'public', 'progress', 'metadata.json')
const waveformPath = path.join(process.cwd(), 'public', 'progress', 'audio.dat')

const splitsPath = path.join(process.cwd(), 'public', 'progress', 'splits.json')
const pointsPath = path.join(process.cwd(), 'public', 'progress', 'points.json')

// running process flags
let isConversionRunning = false
let isProcessingRunning = false
let isSplitting = false

const isProcessRunning = () => isConversionRunning || isProcessingRunning || isSplitting

// execute a command in a subprocess
const runCommand = (
    cmd: string,
    args: string[],
    onOutput: (output: string) => void = console.log,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args)

        proc.stdout.on('data', (data) => onOutput(data.toString()))
        proc.stderr.on('data', (data) => onOutput(data.toString()))

        proc.on('close', (code) => {
            if (code === 0) resolve()
            else reject(new Error(`Command "${cmd}" exited with code ${code}`))
        })
    })
}

const parseTimeToSeconds = (timeStr: string): number => {
    const [hh, mm, ss] = timeStr.split(':')
    const [s, ms = '0'] = ss.split('.')
    return parseInt(hh) * 3600 + parseInt(mm) * 60 + parseInt(s) + parseInt(ms) / 100
}

const getDuration = async (filepath: string): Promise<number> => {
    let duration: number | null = null
    const onOutput = (output: string) => {
        const match = output.match(/Duration:\s+(\d{2}:\d{2}:\d{2}\.\d{2})/)
        if (match) {
            duration = parseTimeToSeconds(match[1])
        }
    }

    await runCommand('ffprobe', ['-hide_banner', filepath], onOutput)
    if (duration === null) {
        throw 'Audio file does not have duration?'
    }

    return duration
}

// const getMetadata = (): Metadata | null => {
//     try {
//         const content = fs.readFileSync(metadataPath, 'utf-8')
//         return JSON.parse(content)
//     } catch {
//         return null
//     }
// }

const updateMetadata = async (filepath: string, audiopath: string, oldMetadata: Metadata | null): Promise<Metadata> => {
    const metadata: Metadata = {
        ...oldMetadata,
        input: filepath,
        audiopath: audiopath,
        wavepath: waveformPath,
        duration: await getDuration(filepath)
    }

    const content = JSON.stringify(metadata)
    fs.writeFileSync(metadataPath, content)

    return metadata
}

const handleAudioConversion = async (socket: Socket, inputFile: string, format: AudioFormat) => {
    const filepath = path.join(process.cwd(), 'public', 'media', inputFile)
    const audiopath = path.join(process.cwd(), 'public', 'progress', `audio.${format}`)

    // get old metadata
    const oldMetadata = readJSONIfExists<Metadata>(metadataPath)
    if (oldMetadata !== null) {
        // remove old audio file
        try {
            fs.unlinkSync(oldMetadata.audiopath)
        } catch {
            // cannot remove audio file if it does not exist
        }
    }

    // update metadata with new input file and audio path
    const metadata = await updateMetadata(filepath, audiopath, oldMetadata)

    // convert audio
    await runCommand('ffmpeg', ['-y', '-i', filepath, audiopath], (output: string) => {
        for (const line of output.split('\n')) {
            const match = line.match(/time=(\d+:\d+:\d+\.\d+)/)
            if (match) {
                const currentTime = parseTimeToSeconds(match[1])
                const pct = (currentTime / metadata.duration) * 100

                socket.emit('progress', { "Audio Conversion": pct })
                break
            }
        }
    })

    socket.emit('progress', { "Audio Conversion": 100 })
}

const handleWaveformCreation = async (socket: Socket) => {
    const metadata: Metadata | null = readJSONIfExists<Metadata>(metadataPath)
    if (metadata === null) {
        // Metadata could not be found
        socket.emit('notification', { type: 'Warning', message: 'The metadata file could not be found! Try to convert the audio file again.', id: 2 })
        return
    }

    // create waveform
    await runCommand(
        'bin/audiowaveform',
        ['-i', metadata.audiopath, '-o', waveformPath, '-b', '8'],
        (output: string) => {
            for (const line of output.split('\n')) {
                if (line.trim().startsWith('Done:')) {
                    const progress = line.match(/\d+(?=\%)/)?.toString()

                    if (progress) {
                        socket.emit('progress', { "Waveform Creation": progress })
                    }

                    break
                }
            }
        }
    )

    socket.emit('progress', { "Waveform Creation": 100 })
}

const handleSilenceDetection = async (socket: Socket, noiseLevel: number, duration: number) => {
    const metadata: Metadata | null = readJSONIfExists<Metadata>(metadataPath)
    if (metadata === null) {
        // Metadata could not be found
        socket.emit('notification', { type: 'Warning', message: 'The metadata file could not be found! Try to convert the audio file again.', id: 2 })
        return
    }

    const startTimes: number[] = []
    const endTimes: number[] = []

    await runCommand(
        'ffmpeg',
        ['-i', metadata.audiopath, '-af', `silencedetect=n=-${noiseLevel}dB:d=${duration}`, '-f', 'null', '-'],
        (output: string) => {
            for (const line of output.split('\n')) {
                const matchStart = line.match(/silence_start: (\d+.\d+)/)
                if (matchStart) {
                    const startTime = parseFloat(matchStart[1])
                    startTimes.push(startTime)
                }

                const matchEnd = line.match(/silence_end: (\d+.\d+)/)
                if (matchEnd) {
                    const endTime = parseFloat(matchEnd[1])
                    endTimes.push(endTime)

                    const pct = (endTime / metadata.duration) * 100
                    socket.emit('progress', { silenceDetection: pct })
                }
            }
        }
    )

    // write detected silence splits to file
    const splitTimes = startTimes.map((time, index) => (time + endTimes[index]) / 2)
    fs.writeFileSync(splitsPath, JSON.stringify(splitTimes))

    socket.emit('progress', { silenceDetection: 100 })
}

const handleAudioSplitting = async (socket: Socket) => {
    const metadata: Metadata | null = readJSONIfExists<Metadata>(metadataPath)
    if (metadata === null) {
        // Metadata could not be found
        socket.emit('notification', { type: 'Warning', message: 'The metadata file could not be found! Try to convert the audio file again.', id: 2 })
        return
    }

    // clear output directory
    const outputDirectory = path.join(process.cwd(), 'public', 'output')
    fs.readdirSync(outputDirectory).forEach(file => {
        fs.unlinkSync(path.join(outputDirectory, file))
    })

    // read split points
    const points = readJSONIfExists<Point[]>(pointsPath)
    if (!points) {
        // points file does not exist
        socket.emit('notification', { type: 'Warning', message: 'The points file could not be found!', id: 1 })
        return
    }

    // only split audio at selected points
    const selectedPoints = points.filter(point => point.selected)

    // get original file extention
    const extension = path.extname(metadata.input)
    const commandArgs = selectedPoints.map((point, index) => {
        const start = point.time
        const end = index < selectedPoints.length - 1 ? selectedPoints[index + 1].time : metadata.duration
        const duration = (end - start).toFixed(3)
        const safeLabel = point.labelText ? point.labelText : `${index}`

        const outputPath = path.join(outputDirectory, `${safeLabel + extension}`)
        return ['-ss', start.toFixed(3), '-t', duration, '-c', 'copy', `"${outputPath}"`]
    })

    commandArgs.forEach((args) => {
        const command = ['ffmpeg', '-i', `"${metadata.input}"`, ...args].join(' ')

        exec(command, (error) => {
            if (error) {
                console.error(`Error: ${error.message}`)
                return
            }
        })
    })
}

io.on('connection', (socket: Socket) => {
    console.log('Connected to', socket.id)

    // convert an audio file to a specific format
    socket.on('conversion', async ({ inputFile, format }) => {
        if (isProcessRunning()) {
            // For now let only one process run at a time
            socket.emit('notification', { type: 'Info', message: 'Another process is already running!', id: 0 })
            return
        }

        isConversionRunning = true
        await handleAudioConversion(socket, inputFile, format)
        isConversionRunning = false
    })

    // processing an audio file includes waveform creation and silence detection
    socket.on('process', async ({ createWaveform, removeSplits, removePoints, detectSilence, noiseLevel, duration }) => {
        if (isProcessRunning()) {
            // For now let only one process run at a time
            socket.emit('notification', { type: 'Info', message: 'Another process is already running!', id: 0 })
            return
        }

        const promises = []
        isProcessingRunning = true

        // create the waveform data from the converted audio
        if (createWaveform) {
            const promise = handleWaveformCreation(socket)
            promises.push(promise)
        }

        // remove previously detected silence splits (if present)
        if (removeSplits) {
            try {
                fs.unlinkSync(splitsPath)
            } catch {
                // cannot remove splits if they do not exist
            }
        }

        // remove previously set split points (if present)
        if (removePoints) {
            try {
                fs.unlinkSync(pointsPath)
            } catch {
                // cannot remove points if they do not exist
            }
        }

        // detect silent segments in the audio file
        if (detectSilence) {
            const promise = handleSilenceDetection(socket, noiseLevel, duration)
            promises.push(promise)
        }

        // wait until all sub-tasks have been completed
        await Promise.all(promises)
        isProcessingRunning = false
    })

    // split the original audio file into segments
    socket.on('split', async () => {
        if (isProcessRunning()) {
            // For now let only one process run at a time
            socket.emit('notification', { type: 'Info', message: 'Another process is already running!', id: 0 })
            return
        }

        isSplitting = true
        socket.emit('notification', { type: 'Info', message: 'Splitting audio... this may take a momement', id: 3 })
        await handleAudioSplitting(socket)
        socket.emit('notification', { type: 'Success', message: 'Splitting audio complete!', id: 4 })
        isSplitting = false
    })
})

// create subdirectories if they do not exist
for (const dirname of ['media', 'output', 'progress']) {
    const dirpath = path.join(process.cwd(), 'public', dirname)

    if (!fs.existsSync(dirpath)) {
        fs.mkdirSync(dirpath, { recursive: true });
    }
}

// start http server
httpServer.listen(port, () => {
    console.log(`WebSocket server listening on ws://localhost:${port}`)
})