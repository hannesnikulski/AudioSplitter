'use client'

import { Fragment, useEffect, useRef, useState } from 'react'

import { ToastContainer } from 'react-toastify'
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'flowbite-react'

import Link from 'next/link'
import { getSocket } from '@/lib/socket'
import { formatTimeNice } from '@/lib/misc'
import { Metadata, Point } from '@/lib/types'
import { IoMdArrowBack } from 'react-icons/io'
import { Notification, sendNotification } from '@/lib/notifications'
import SocketStatusComponent from '@/lib/components/SocketStatusComponent'

import { WaveformView } from './Waveform'
import PointDividerList from './PointDividerList'

type Props = {
    initialPoints: Point[],
    metadata: Metadata | null
}

export default function ClientComponent({ initialPoints, metadata }: Props) {
    const [isConnected, setIsConnected] = useState<boolean>(false)
    const socket = getSocket()

    useEffect(() => {
        setIsConnected(socket.connected)
        socket.on('connect', () => setIsConnected(true))
        socket.on('disconnect', () => setIsConnected(false))

        socket.on('notification', (notification: Notification) => sendNotification(notification))
    }, [])

    const peaksComponent = useRef<WaveformView>(null)

    const [openModal, setOpenModal] = useState(false)
    const [points, setPoints] = useState<Point[]>(initialPoints)

    const selected = points.filter((p) => p.selected)

    const updatePoints = (input: Point[] | ((prev: Point[]) => Point[])) => {
        setPoints(prev => {
            const next = typeof input === 'function' ? input(prev) : input

            // Save to server
            const promise = fetch('/api/save-points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(next),
            })

            promise.then(response => response.ok ? null : console.log('Error uploading points!'))
            return next
        })
    }

    const onSplitAudio = () => {
        socket.emit('split', null)
        setOpenModal(false)
    }

    return (
        <div className='w-screen h-screen relative flex flex-col divide-y divide-gray-200'>
            {/* Notifications */}
            <ToastContainer toastClassName={() => "bg-transparent shadow-none p-0 m-0"} />

            <div className="grow flex flex-col min-h-0 divide-y divide-gray-200">
                {/* Header */}
                <div className="relative flex justify-center items-center p-2">
                    <Button className='absolute left-2 px-2.5 py-1.5 cursor-pointer rounded' size='xs' as={Link} href="/process">
                        <IoMdArrowBack className="mr-2 h-5 w-5" />
                        Audio Processing
                    </Button>

                    <span className="text-3xl font-bold tracking-tight">Audio Splitter</span>

                    <Button className='absolute right-2 min-w-12 px-2.5 py-1.5 cursor-pointer rounded' size='xs' onClick={() => setOpenModal(true)}>
                        Split
                    </Button>
                </div>

                <PointDividerList
                    points={points}
                    peaksComponentRef={peaksComponent}
                />
            </div>

            <div className='w-full shrink-0 overflow-hidden'>
                <WaveformView
                    audioUrl={metadata?.audiopath ?? '/progress/audio.wav'}
                    audioContentType='wav'
                    waveformDataUrl={metadata?.wavepath ?? '/progress/audio.dat'}
                    points={points}
                    setPoints={updatePoints}
                    ref={peaksComponent}
                />
            </div>

            <Modal show={openModal} onClose={() => setOpenModal(false)} className="h">
                <ModalHeader className="border-gray-300">
                    Chapters
                </ModalHeader>
                <ModalBody>
                    <div className="grid grid-cols-[auto_1fr_auto] gap-1 p-4 text-sm">
                        <div className="font-semibold text-gray-600">Nr.</div>
                        <div className="font-semibold text-gray-600">Section Label</div>
                        <div className="font-semibold text-gray-600">Duration</div>
                        <div className="col-span-3 border-b border-gray-300 my-2"></div>
                        {selected.map((point, index) => (
                            <Fragment key={index}>
                                <div>
                                    {index}
                                </div>
                                <div>
                                    {point.labelText}
                                </div>
                                <div className="text-end">
                                    {index < selected.length - 1 ? formatTimeNice(selected[index + 1].time - point.time) : formatTimeNice(metadata?.duration! - point.time)}
                                </div>
                            </Fragment>
                        ))}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button className="cursor-pointer" onClick={onSplitAudio}>
                        Split
                    </Button>
                    <Button color="alternative" className="cursor-pointer" onClick={() => setOpenModal(false)}>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            <SocketStatusComponent isConnected={isConnected} />
        </div>
    )
}