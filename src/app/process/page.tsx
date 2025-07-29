import fs from 'fs'
import path from 'path'

import ClientComponent from './ClientComponent'

const allowedAudioExtensions = ['mp3', 'wav', 'm4a', 'opus']

export default function Page() {
    const mediaPath = path.join(process.cwd(), 'public', 'media')

    try {
        const mediaFiles = fs.readdirSync(mediaPath)
        const audioFiles = mediaFiles.filter(filename => allowedAudioExtensions.includes(path.extname(filename).slice(1)))

        return <ClientComponent audioFiles={audioFiles} />
    } catch {
        return (
            <div className='w-screen h-screen flex justify-center items-center'>
                <span className='font-light tracking-wide text-gray-500 text-lg'>Make sure the <span className='px-2 py-1.5 font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg'>/public/media</span> path exists in you project root!</span>
            </div>
        )
    }
}