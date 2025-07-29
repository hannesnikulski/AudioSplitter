import fs from 'fs'
import path from 'path'

import { Metadata, Point } from '@/lib/types'

import ClientComponent from './ClientComponent'
import Link from 'next/link'
import { metadataPath, pointsPath, readJSONIfExists, splitsPath } from '@/lib/config'

export default function Page() {
    const publicDirectory = path.join(process.cwd(), 'public')
    const relative = (abspath: string) => path.relative(publicDirectory, abspath)

    let points: Point[] = []

    if (!fs.existsSync(path.dirname(splitsPath))) {
        return renderError(
            <>
                Make sure the <span className='px-2 py-1.5 font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg'>/public/progress</span> path exists in you project root!<br />
                Click <Link className='text-primary-600 underline' href="/">here</Link> to convert an audio file first.
            </>
        )
    }

    const existingPoints = readJSONIfExists<Point[]>(pointsPath)
    const splits = readJSONIfExists<number[]>(splitsPath)

    if (existingPoints) {
        points = existingPoints
    } else if (splits) {
        points = splits.map((time, index) => ({
            id: index.toString(),
            time: Number(time),
            labelText: `Marker ${index}`,
            selected: false,
            editable: false,
        }))
    }

    const metadata = readJSONIfExists<Metadata>(metadataPath)
    const missingFiles: string[] = []

    if (metadata) {
        for (const filepath of [metadata.audiopath, metadata.wavepath]) {
            if (!fs.existsSync(filepath)) {
                missingFiles.push(relative(filepath))
            }
        }

        if (missingFiles.length === 0) {
            metadata.audiopath = relative(metadata.audiopath)
            metadata.wavepath = relative(metadata.wavepath)

            return <ClientComponent initialPoints={points} metadata={metadata} />
        }
    } else {
        missingFiles.push(relative(metadataPath))
    }

    return renderError(
        <>
            The following files could not be found:<br />
            {missingFiles.map(filepath => (
                <span
                    key={filepath}
                    className="px-2 py-1.5 mx-1 font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg"
                >
                    {filepath}
                </span>
            ))}
            <br />
            Click <Link className="text-primary-600 underline" href="/">here</Link> to convert an audio file first.
        </>
    )
}

function renderError(message: React.ReactNode) {
    return (
        <div className="w-screen h-screen flex justify-center items-center text-center">
            <span className="font-light tracking-wide text-gray-500 text-lg/8">
                {message}
            </span>
        </div>
    )
}