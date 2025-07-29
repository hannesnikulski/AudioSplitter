import { Component, createRef, Dispatch, ReactNode, RefObject, SetStateAction } from "react"

import { Button, RangeSlider } from "flowbite-react"
import { PeaksInstance } from "peaks.js"

import { Point } from "@/lib/types"
import { formatTime } from "@/lib/misc"
import { IoMdAdd, IoMdPause, IoMdPlay, IoMdSkipBackward, IoMdSkipForward } from "react-icons/io"

type State = {
    isPlaying: boolean
    time: number
}

type Props = {
    audioUrl: string
    audioContentType: string
    waveformDataUrl: string
    points: Point[]
    setPoints: Dispatch<SetStateAction<Point[]>>
}

export class WaveformView extends Component<{}, State> {
    zoomviewWaveformRef: RefObject<HTMLDivElement | null>
    overviewWaveformRef: RefObject<HTMLDivElement | null>
    audioElementRef: RefObject<HTMLAudioElement | null>
    peaks: PeaksInstance | null
    props: Props

    pointIndex: number | null

    constructor(props: Props) {
        super(props)
        this.props = props

        this.zoomviewWaveformRef = createRef<HTMLDivElement>()
        this.overviewWaveformRef = createRef<HTMLDivElement>()
        this.audioElementRef = createRef<HTMLAudioElement>()
        this.peaks = null

        this.state = { isPlaying: false, time: 0 }
        this.pointIndex = null
    }

    skipToNextPoint() {
        // check peaks is initialised
        if (this.peaks === null) return
        const instance = this.peaks

        // get point by id and seek to timestamp
        const points = instance.points.getPoints()
        this.seekToPoint(points[this.pointIndex === null ? 0 : Math.min(++this.pointIndex, points.length - 1)].id)
    }

    skipToPreviousPoint() {
        // check peaks is initialised
        if (this.peaks === null) return
        const instance = this.peaks

        // get point by id and seek to timestamp
        const points = instance.points.getPoints()
        this.seekToPoint(points[this.pointIndex === null ? 0 : Math.max(0, --this.pointIndex)].id)
    }

    selectPoint(id: string | undefined) {
        // check peaks is initialised
        if (this.peaks === null || id === undefined) return
        const instance = this.peaks

        // get point by id
        const point = instance.points.getPoint(id)
        if (point === undefined) return

        // update point and shared point list
        point.update({ editable: true, selected: true })
        this.props.setPoints(prev => prev.map(p => p.id == point.id ? { ...p, editable: true, selected: true } : p))
    }

    deselectPoint(id: string | undefined) {
        // check peaks is initialised
        if (this.peaks === null || id === undefined) return
        const instance = this.peaks

        // get point by id
        const point = instance.points.getPoint(id)
        if (point === undefined) return

        // update point and shared point list
        point.update({ editable: false, selected: false })
        this.props.setPoints(prev => prev.map(p => p.id == point.id ? { ...p, editable: false, selected: false } : p))
    }

    seekToPoint(id: string | undefined) {
        // check peaks is initialised
        if (this.peaks === null || id === undefined) return
        const instance = this.peaks

        // get point by id
        const point = instance.points.getPoint(id)
        if (point === undefined) return

        // seek to timestamp of point
        instance.player.seek(point.time)

        // update point index to current point
        const points = instance.points.getPoints()
        this.pointIndex = points.findIndex(point => point.id === id)
    }

    renamePoint(id: string | undefined, newLabel: string) {
        // check peaks is initialised
        if (this.peaks === null || id === undefined) return
        const instance = this.peaks

        // get point by id
        const point = instance.points.getPoint(id)
        if (point === undefined) return

        // update point and shared point list
        point.update({ labelText: newLabel })
        this.props.setPoints(prev => prev.map(p => p.id == point.id ? { ...p, labelText: newLabel } : p))
    }

    addPoint() {
        // check peaks is initialised
        if (this.peaks === null) return
        const instance = this.peaks

        // get current time and points
        const currentTime = instance.player.getCurrentTime()
        const points = instance.points.getPoints()

        // create new point
        const newPoint = {
            id: points.length.toString(),
            time: currentTime,
            labelText: `Marker ${points.length}`,
            selected: true,
            editable: true
        }

        // add point and update shared point list
        instance.points.add(newPoint)
        this.props.setPoints(prev => [...prev, newPoint])
    }

    removePoint(id: string | undefined) {
        // check peaks is initialised
        if (this.peaks === null || id === undefined) return
        const instance = this.peaks

        instance.points.removeById(id)
        this.props.setPoints(prev => prev.filter(p => p.id !== id))
    }

    sortPoints() {
        // check peaks is initialised
        if (this.peaks === null) return
        const instance = this.peaks

        this.props.setPoints(prev => {
            // sort points by time and reindex
            const sorted = prev.sort((p1, p2) => p1.time - p2.time).map((p, index) => ({ ...p, id: index.toString() }))

            // reset point indexer
            this.pointIndex = null

            // update points
            instance.points.removeAll()
            instance.points.add(sorted)

            return sorted
        })
    }

    render(): ReactNode {
        return (
            <div className="w-full h-full divide-y divide-gray-200">
                {/* Controls */}
                <div className="relative flex items-center justify-center space-x-4 px-4 py-3">
                    <span className="absolute left-2 flex space-x-2" >
                        <RangeSlider min={0} max={100} defaultValue={100} id="volume" onChange={(e) => {
                            if (this.audioElementRef.current) {
                                this.audioElementRef.current.volume = parseInt(e.target.value) / 100
                            }
                        }} />
                        <span>{this.audioElementRef.current && Math.round(this.audioElementRef.current?.volume * 100)}%</span>
                    </span>

                    <Button className="w-8 h-8 p-1.5 cursor-pointer rounded border-0" size="sm" outline onClick={() => this.skipToPreviousPoint()}>
                        <IoMdSkipBackward />
                    </Button>

                    <Button className="w-8 h-8 p-1.5 cursor-pointer rounded border-0" size="sm" outline
                        onClick={() =>
                            this.state.isPlaying ? this.peaks?.player.pause() : this.peaks?.player.play()
                        }
                    >
                        {this.state.isPlaying ? <IoMdPause /> : <IoMdPlay />}
                    </Button>
                    <Button className="w-8 h-8 p-1.5 cursor-pointer rounded border-0" size="sm" outline onClick={() => this.skipToNextPoint()}>
                        <IoMdSkipForward />
                    </Button>
                    <Button className="w-8 h-8 p-1.5 cursor-pointer rounded border-0" size="sm" outline onClick={() => this.addPoint()}>
                        <IoMdAdd />
                    </Button>



                    {/* Time display */}
                    <span className="absolute right-2 text-center rounded border border-gray-200 py-1 px-2">
                        {formatTime(this.state.time)}
                    </span>
                </div>

                <div className="overview-container" style={{ width: '100%', minHeight: 125 }} ref={this.overviewWaveformRef}></div>
                <div className="zoomview-container" style={{ width: '100%', minHeight: 125 }} ref={this.zoomviewWaveformRef}></div>

                <audio ref={this.audioElementRef}>
                    <source src={this.props.audioUrl} type={this.props.audioContentType} />
                    Your browser does not support the audio element.
                </audio>
            </div >
        )
    }

    componentDidMount() {
        this.initPeaks()
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.audioUrl === prevProps.audioUrl) {
            return
        }

        this.initPeaks()
    }

    initPeaks() {
        const options = {
            overview: {
                container: this.overviewWaveformRef.current!
            },
            zoomview: {
                container: this.zoomviewWaveformRef.current!
            },
            mediaElement: this.audioElementRef.current!,
            dataUri: {
                arraybuffer: this.props.waveformDataUrl
            },
            keyboard: true,
            logger: console.error.bind(console),
        }

        this.audioElementRef.current!.src = this.props.audioUrl

        if (this.peaks) {
            this.peaks.destroy()
            this.peaks = null
        }

        const asyncInitPeaks = async () => {
            const Peaks = (await import('peaks.js')).default

            Peaks.init(options, (err, instance) => {
                if (err) {
                    console.error(err.message)
                    console.log(this.props)
                    return
                }
                if (instance === undefined) return

                this.peaks = instance
                this.onPeaksReady()
            })
        }

        asyncInitPeaks()
    }

    componentWillUnmount() {
        if (this.peaks) {
            this.peaks.destroy()
        }
    }

    onPeaksReady = () => {
        if (this.peaks === null) return
        const instance = this.peaks

        instance.on('player.playing', () => {
            this.setState(prev => ({ ...prev, isPlaying: true }))
        })

        instance.on('player.pause', () => {
            this.setState(prev => ({ ...prev, isPlaying: false }))
        })

        instance.on('player.timeupdate', () => {
            this.setState(prev => ({ ...prev, time: instance.player.getCurrentTime() }))
        })

        instance.on('points.dragend', (event) => {
            this.props.setPoints(prev => prev.map(p => p.id == event.point.id ? { ...p, time: event.point.time } : p))
        })

        instance.points.add(this.props.points)
    }
}