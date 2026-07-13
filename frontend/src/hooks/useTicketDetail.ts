import { useCallback, useEffect, useRef, useState } from 'react'
import { getTicket, listComments } from '@/api/tickets.api'
import { ApiClientError } from '@/types'
import type { Comment, Ticket } from '@/types'

export interface UseTicketDetailResult {
  ticket: Ticket | null
  comments: Comment[]
  loading: boolean
  error: ApiClientError | null
  refetch: () => Promise<void>
}

export function useTicketDetail(id: string | undefined): UseTicketDetailResult {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiClientError | null>(null)
  const requestIdRef = useRef(0)

  const refetch = useCallback(async (): Promise<void> => {
    const requestId = ++requestIdRef.current

    if (!id) {
      setTicket(null)
      setComments([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [ticketData, commentData] = await Promise.all([
        getTicket(id),
        listComments(id),
      ])
      if (requestId !== requestIdRef.current) return
      setTicket(ticketData)
      setComments(commentData)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setTicket(null)
      setComments([])
      setError(
        err instanceof ApiClientError
          ? err
          : new ApiClientError('UNKNOWN_ERROR', 'Failed to load ticket', 0)
      )
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [id])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { ticket, comments, loading, error, refetch }
}
