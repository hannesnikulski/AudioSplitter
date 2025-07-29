import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
    const points = await req.json()

    const filePath = path.join(process.cwd(), 'public', 'progress', 'points.json')
    await writeFile(filePath, JSON.stringify(points, null, 2))

    return NextResponse.json({ success: true })
}