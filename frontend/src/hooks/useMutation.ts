import { useCallback, useRef, useState } from 'react'
import { ApiClientError } from '@/types'

export interface UseMutationResult<TArgs extends unknown[], TResult> {
  mutate: (...args: TArgs) => Promise<TResult | undefined>
  loading: boolean
  error: ApiClientError | null
  reset: () => void
}

export function useMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>
): UseMutationResult<TArgs, TResult> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiClientError | null>(null)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const reset = useCallback((): void => {
    setError(null)
  }, [])

  const mutate = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      setLoading(true)
      setError(null)
      try {
        return await fnRef.current(...args)
      } catch (err) {
        const apiError =
          err instanceof ApiClientError
            ? err
            : new ApiClientError(
                'UNKNOWN_ERROR',
                err instanceof Error ? err.message : 'Something went wrong',
                0
              )
        setError(apiError)
        return undefined
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { mutate, loading, error, reset }
}
