import type { ApiClientError } from '@/types'

interface ErrorMessageProps {
  error: ApiClientError | null
  className?: string
}

export function ErrorMessage({
  error,
  className = '',
}: ErrorMessageProps): React.ReactElement | null {
  if (!error) return null

  return (
    <div className={`error-message ${className}`.trim()} role="alert">
      <p>{error.message}</p>
      {error.code === 'INVALID_TRANSITION' ? (
        <p className="error-code">Code: {error.code}</p>
      ) : null}
    </div>
  )
}
