export function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0')
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0')
    const ms = ((seconds % 1) * 1000).toFixed(0).padStart(3, '0')
    return `${hrs}:${mins}:${secs}.${ms}`
}

export function formatTimeNice(seconds: number): string {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
}
