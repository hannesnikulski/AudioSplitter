import { SyntheticEvent, useState } from "react"

import { Button, Label, Select } from "flowbite-react"

type Props = {
    socket: SocketIOClient.Socket | null
    audioFiles: string[]
}

export default function AudioConversion({ socket, audioFiles }: Props) {
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [audioFormat, setAudioFormat] = useState('wav')

    const onFormSubmit = (e: SyntheticEvent) => {
        e.preventDefault()

        socket?.emit('conversion', { inputFile: selectedFile, format: audioFormat })
    }

    return (
        <form action="" className="max-w-3xl mx-auto flex flex-col space-y-4 p-4" onSubmit={onFormSubmit}>
            <div>
                <Label className="mb-2 block" htmlFor="audio-file">Choose the audio file you want to process:</Label>
                <Select
                    id="audio-file"
                    value={selectedFile ?? ''}
                    onChange={(e) => setSelectedFile(e.target.value)}
                    required
                >
                    <option disabled value=''>Select files from /public/media/...</option>
                    {audioFiles.map((file, index) => <option key={index} value={file}>{file}</option>)}
                </Select>
            </div>

            <div>
                <Label className="mb-2 block" htmlFor="audioFormat">Choose audio format</Label>
                <Select
                    id="audioFormat"
                    value={audioFormat}
                    onChange={(e) => setAudioFormat(e.target.value)}
                >
                    <option value="wav">WAV</option>
                    <option value="opus">Opus</option>
                    <option value="mp3">MP3</option>
                </Select>

            </div>

            <Button type="submit">Convert Audio</Button>
        </form>
    )
}