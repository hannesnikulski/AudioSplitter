import { Progress } from "flowbite-react"

type Props = {
    label: string
    progress: number
}

export default function ProgressBar({ label, progress }: Props) {
    const roundedProgress = Math.round(progress)

    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between text-base font-medium">
                <span>{label}</span>
                <span>{Math.round(roundedProgress)}%</span>
            </div>

            <Progress progress={progress} size="md" />
        </div>
    )
}