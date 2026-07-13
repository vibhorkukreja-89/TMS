import {
  formatStatusLabel,
  getNextStatuses,
} from '@/lib/status-transitions'
import type { TicketStatus } from '@/types'

interface StatusControlProps {
  currentStatus: TicketStatus
  disabled?: boolean
  onChange: (status: TicketStatus) => void
}

export function StatusControl({
  currentStatus,
  disabled = false,
  onChange,
}: StatusControlProps): React.ReactElement {
  const nextStatuses = getNextStatuses(currentStatus)

  if (nextStatuses.length === 0) {
    return (
      <p className="status-control-empty">
        No further transitions from this status.
      </p>
    )
  }

  return (
    <div className="status-control">
      {nextStatuses.map((status) => (
        <button
          key={status}
          type="button"
          className="btn btn-secondary"
          disabled={disabled}
          onClick={() => onChange(status)}
        >
          → {formatStatusLabel(status)}
        </button>
      ))}
    </div>
  )
}
