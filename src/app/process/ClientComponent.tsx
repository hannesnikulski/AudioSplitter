'use client'

import { useEffect, useState } from "react"

import { Button } from "flowbite-react"
import { ToastContainer } from "react-toastify"

import Link from "next/link"
import { getSocket } from "@/lib/socket"
import { IoMdArrowForward } from "react-icons/io"
import ProgressBar from "@/lib/components/ProgressBar"
import { Notification, sendNotification } from "@/lib/notifications"
import SocketStatusComponent from "@/lib/components/SocketStatusComponent"

import AudioConversion from "./AudioConversion"
import AudioProcessing from "./AudioProcessing"

type Props = {
    audioFiles: string[]
}

export default function ClientComponent({ audioFiles }: Props) {
    const [progress, setProgress] = useState<{ [key: string]: number }>({})
    const [isConnected, setIsConnected] = useState<boolean>(false)

    const socket = getSocket()

    useEffect(() => {
        setIsConnected(socket.connected)
        socket.on('connect', () => setIsConnected(true))
        socket.on('disconnect', () => setIsConnected(false))

        socket.on('progress', (progressUpdate: { [key: string]: number }) => {
            setProgress((progress) => ({ ...progress, ...progressUpdate }))
        })
        socket.on('notification', (notification: Notification) => sendNotification(notification))
    }, [])

    return (
        <div className='w-screen min-h-screen relative flex flex-col divide-y divide-gray-200'>
            {/* Notifications */}
            <ToastContainer toastClassName={() => "bg-transparent shadow-none p-0 m-0"} />

            {/* Header */}
            <div className="relative flex justify-center items-center p-2">
                <span className="text-3xl font-bold tracking-tight">Audio Processing</span>

                <Button className='absolute right-2 px-2.5 py-1.5 cursor-pointer rounded' size='xs' as={Link} href="/splitter">
                    Audio Splitting
                    <IoMdArrowForward className="ml-2 h-5 w-5" />
                </Button>
            </div>
            {/* Content */}
            <div className="grow">
                <div className="p-2 text-center text-lg font-medium text-gray-600 border-b border-gray-200">
                    Step 1: Convert Audio
                </div>

                <AudioConversion socket={socket} audioFiles={audioFiles} />

                <div className="p-2 text-center text-lg font-medium text-gray-600 border-y border-gray-200 ">
                    Step 2: Process Audio
                </div>

                <AudioProcessing socket={socket} />

                <div className="p-2 text-center text-lg font-medium text-gray-600 border-y border-gray-200">
                    Progress
                </div>

                <div className="max-w-3xl mx-auto flex flex-col space-y-4 p-4">
                    {Object.entries(progress).map(([label, value], index) => <ProgressBar key={index} label={label} progress={value}></ProgressBar>)}
                </div>
            </div>

            <SocketStatusComponent isConnected={isConnected} />
        </div>
    )
}
