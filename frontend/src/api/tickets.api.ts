import { fetchJson } from '@/api/client'
import type {
  Comment,
  CreateCommentInput,
  CreateTicketInput,
  Ticket,
  TicketStatus,
  UpdateTicketInput,
} from '@/types'

export interface ListTicketsParams {
  search?: string
  status?: TicketStatus
}

export function listTickets(params: ListTicketsParams = {}): Promise<Ticket[]> {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  const qs = query.toString()
  return fetchJson<Ticket[]>(`/api/tickets${qs ? `?${qs}` : ''}`)
}

export function getTicket(id: string): Promise<Ticket> {
  return fetchJson<Ticket>(`/api/tickets/${id}`)
}

export function createTicket(body: CreateTicketInput): Promise<Ticket> {
  return fetchJson<Ticket>('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateTicket(
  id: string,
  body: UpdateTicketInput
): Promise<Ticket> {
  return fetchJson<Ticket>(`/api/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function changeTicketStatus(
  id: string,
  status: TicketStatus
): Promise<Ticket> {
  return fetchJson<Ticket>(`/api/tickets/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function listComments(ticketId: string): Promise<Comment[]> {
  return fetchJson<Comment[]>(`/api/tickets/${ticketId}/comments`)
}

export function addComment(
  ticketId: string,
  body: CreateCommentInput
): Promise<Comment> {
  return fetchJson<Comment>(`/api/tickets/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
