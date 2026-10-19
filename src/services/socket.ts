import { createMockSocket } from './mockSocket'

export interface SocketLike {
  onopen: (() => void) | null
  onmessage: ((data: unknown) => void) | null
  onclose: (() => void) | null
  close: () => void
}

const isWebSocketUrl = (value: string) => {
  try {
    const { protocol } = new URL(value)
    return protocol === 'wss:' || protocol === 'ws:'
  } catch {
    return false
  }
}

const openWebSocket = (url: string): SocketLike => {
  const ws = new WebSocket(url)
  const socket: SocketLike = { onopen: null, onmessage: null, onclose: null, close: () => ws.close() }

  ws.onopen = () => socket.onopen?.()
  ws.onmessage = (message: MessageEvent<unknown>) => socket.onmessage?.(message.data)
  ws.onclose = () => socket.onclose?.()

  return socket
}

// falls back to the simulated stream when no valid ws:// or wss:// url is configured
export const openSocket = (url: string): SocketLike =>
  isWebSocketUrl(url) ? openWebSocket(url) : createMockSocket()
