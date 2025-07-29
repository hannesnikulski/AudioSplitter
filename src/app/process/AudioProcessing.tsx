import { SyntheticEvent, useState } from "react"

import { Button, Checkbox, Label, TextInput } from "flowbite-react"

type Props = {
    socket: SocketIOClient.Socket | null
}

export default function AudioProcessing({ socket }: Props) {
    const [createWaveform, setCreateWaveform] = useState<boolean>(false)
    const [removeSplits, setRemoveSplits] = useState<boolean>(false)
    const [removePoints, setRemovePoints] = useState<boolean>(false)
    const [detectSilence, setDetectSilence] = useState<boolean>(false)
    const [noiseLevel, setNoiseLevel] = useState<number>(50)
    const [duration, setDuration] = useState<number>(2)

    const onFormSubmit = (e: SyntheticEvent) => {
        e.preventDefault()

        socket?.emit('process', { createWaveform, removeSplits, removePoints, detectSilence, noiseLevel, duration })
    }

    return (
        <form action="" className="max-w-3xl mx-auto flex flex-col space-y-4 p-4" onSubmit={onFormSubmit}>
            <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="waveformData"
                        checked={createWaveform}
                        onChange={() => setCreateWaveform(!createWaveform)}
                    />
                    <Label htmlFor="waveformData">Create Waveform Data</Label>
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="splitsRemove"
                        checked={removeSplits}
                        onChange={() => setRemoveSplits(!removeSplits)}
                    />
                    <Label htmlFor="splitsRemove">RemoveSplits</Label>
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="detectSilence"
                        checked={detectSilence}
                        onChange={() => setDetectSilence(!detectSilence)}
                    />
                    <Label htmlFor="detectSilence">Detect Silence</Label>
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="removePoints"
                        checked={removePoints}
                        onChange={() => setRemovePoints(!removePoints)}
                    />
                    <Label htmlFor="removePoints">RemovePoints</Label>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div>
                    <Label className="mb-2 block font-medium" htmlFor="noiseLevel">Noise Level</Label>
                    <TextInput
                        id="noiseLevel"
                        type="number"
                        value={noiseLevel}
                        onChange={(e) => setNoiseLevel(Number(e.target.value))}
                        disabled={!detectSilence}
                    />
                </div>
                <div>
                    <Label className="mb-2 block font-medium" htmlFor="duration">Duration</Label>
                    <TextInput
                        id="duration"
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        disabled={!detectSilence}
                    />
                </div>
            </div>

            <Button type="submit">Process Audio</Button>
        </form>
    )
}