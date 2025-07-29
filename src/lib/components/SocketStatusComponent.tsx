type Props = {
    isConnected: boolean
}

export default function SocketStatusComponent({ isConnected }: Props) {
    return (
        <div className="fixed right-4 bottom-4 flex items-center px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white">
            {/* Indicator */}
            <span
                className={"flex w-3 h-3 me-2 rounded-full " + (isConnected ? 'bg-green-500' : 'bg-red-500')}
            ></span>

            {/* Label */}
            <span>WebSocket</span>
        </div>
    )
}