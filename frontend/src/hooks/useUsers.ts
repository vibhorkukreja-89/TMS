import { useCallback, useEffect, useState } from 'react'
import { listUsers } from '@/api/users.api'
import { ApiClientError } from '@/types'
import type { User } from '@/types'

export interface UseUsersResult {
  users: User[]
  loading: boolean
  error: ApiClientError | null
  refetch: () => Promise<void>
}

export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiClientError | null>(null)

  const refetch = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const data = await listUsers()
      setUsers(data)
    } catch (err) {
      setUsers([])
      setError(
        err instanceof ApiClientError
          ? err
          : new ApiClientError('UNKNOWN_ERROR', 'Failed to load users', 0)
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { users, loading, error, refetch }
}
