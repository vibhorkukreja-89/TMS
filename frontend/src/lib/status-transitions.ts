import type { TicketStatus } from '@/types'

export const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['RESOLVED', 'CANCELLED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
}

export function getNextStatuses(status: TicketStatus): TicketStatus[] {
  return VALID_TRANSITIONS[status]
}

export function formatStatusLabel(status: TicketStatus): string {
  return status
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}
