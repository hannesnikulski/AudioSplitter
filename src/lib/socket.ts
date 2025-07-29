import io from 'socket.io-client'

let socket: SocketIOClient.Socket | null = null
export const port = 3001

export function getSocket() {
    if (!socket) {
        socket = io(`ws://localhost:${port}`)
    }
    return socket
}
