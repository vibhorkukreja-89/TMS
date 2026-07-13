import { ApiClientError } from '@/types'

export async function fetchJson<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  let res: Response
  const headers = new Headers(init?.headers)
  if (init?.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    res = await fetch(input, {
      ...init,
      headers,
    })
  } catch {
    throw new ApiClientError(
      'NETWORK_ERROR',
      'Unable to reach the server. Check that the API is running.',
      0
    )
  }

  const body: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const err = body as { error?: { code?: string; message?: string } } | null
    throw new ApiClientError(
      err?.error?.code ?? 'UNKNOWN_ERROR',
      err?.error?.message ?? `Request failed (${res.status})`,
      res.status
    )
  }

  const success = body as { data: T }
  return success.data
}
