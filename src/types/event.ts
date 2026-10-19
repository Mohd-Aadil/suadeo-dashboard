export const EVENT_LEVELS = ['info', 'warning', 'critical'] as const

export type EventLevel = (typeof EVENT_LEVELS)[number]

export interface LiveEvent {
  id: string
  timestamp: number
  service: string
  level: EventLevel
  latencyMs: number
  message: string
}
