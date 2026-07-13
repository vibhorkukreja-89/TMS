import { useCallback, useEffect, useRef, useState } from 'react'
import { listTickets } from '@/api/tickets.api'
import { ApiClientError } from '@/types'
import type { Ticket, TicketStatus } from '@/types'

export interface UseTicketsResult {
  tickets: Ticket[]
  loading: boolean
  error: ApiClientError | null
  search: string
  setSearch: (value: string) => void
  status: TicketStatus | ''
  setStatus: (value: TicketStatus | '') => void
  refetch: () => Promise<void>
}

export function useTickets(): UseTicketsResult {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiClientError | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TicketStatus | ''>('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const requestIdRef = useRef(0)

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(id)
  }, [search])

  const refetch = useCallback(async (): Promise<void> => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    try {
      const data = await listTickets({
        search: debouncedSearch.trim() || undefined,
        status: status || undefined,
      })
      if (requestId !== requestIdRef.current) return
      setTickets(data)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setTickets([])
      setError(
        err instanceof ApiClientError
          ? err
          : new ApiClientError('UNKNOWN_ERROR', 'Failed to load tickets', 0)
      )
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [debouncedSearch, status])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return {
    tickets,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    refetch,
  }
}
