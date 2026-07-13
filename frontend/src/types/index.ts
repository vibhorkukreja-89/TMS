export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED'

export interface UserSummary {
  id: string
  name: string
  email: string
}

export interface User extends UserSummary {
  role: 'AGENT' | 'ADMIN'
  createdAt: string
}

export interface Comment {
  id: string
  ticketId: string
  message: string
  createdById: string
  createdAt: string
  createdBy: UserSummary
}

export interface Ticket {
  id: string
  title: string
  description: string | null
  priority: Priority
  status: TicketStatus
  createdById: string
  assignedToId: string | null
  createdAt: string
  updatedAt: string
  createdBy: UserSummary
  assignedTo: UserSummary | null
}

export interface CreateTicketInput {
  title: string
  description?: string
  priority: Priority
  createdById: string
  assignedToId?: string
}

export interface UpdateTicketInput {
  title?: string
  description?: string | null
  priority?: Priority
  assignedToId?: string | null
}

export interface CreateCommentInput {
  message: string
  createdById: string
}

export interface ApiSuccess<T> {
  data: T
  meta?: { total: number }
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export class ApiClientError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
  }
}
