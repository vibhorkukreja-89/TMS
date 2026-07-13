import { ApiClientError } from '@/types'

function messageFromErrorBody(
  body: unknown,
  status: number
): { code: string; message: string } {
  const err = body as {
    error?: {
      code?: string
      message?: string
      details?: Record<string, string[] | undefined>
    }
  } | null

  const code = err?.error?.code ?? 'UNKNOWN_ERROR'
  const base =
    err?.error?.message ?? `Request failed (${status})`

  const details = err?.error?.details
  if (details && typeof details === 'object') {
    const parts = Object.entries(details).flatMap(([field, messages]) =>
      Array.isArray(messages)
        ? messages.map((msg) => (field === 'message' ? msg : `${field}: ${msg}`))
        : []
    )
    if (parts.length > 0) {
      return { code, message: parts.join('; ') }
    }
  }

  return { code, message: base }
}

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
    const { code, message } = messageFromErrorBody(body, res.status)
    throw new ApiClientError(code, message, res.status)
  }

  const success = body as { data: T }
  return success.data
}
