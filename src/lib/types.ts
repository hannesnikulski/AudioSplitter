export type Metadata = {
    input: string
    audiopath: string
    wavepath: string
    duration: number
}

export type Point = {
    id?: string
    time: number
    labelText?: string
    selected?: boolean
    editable?: boolean
}