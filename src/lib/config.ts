import fs from 'fs'
import path from 'path'

export const splitsPath = path.join(process.cwd(), 'public', 'progress', 'splits.json')
export const pointsPath = path.join(process.cwd(), 'public', 'progress', 'points.json')
export const metadataPath = path.join(process.cwd(), 'public', 'progress', 'metadata.json')

export function readJSONIfExists<T>(filepath: string): T | null {
    try {
        const content = fs.readFileSync(filepath, 'utf-8')
        return JSON.parse(content)
    } catch {
        return null
    }
}