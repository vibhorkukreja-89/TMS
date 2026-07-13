import { formatStatusLabel } from '@/lib/status-transitions'
import type { TicketStatus } from '@/types'

interface StatusBadgeProps {
  status: TicketStatus
}

export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      {formatStatusLabel(status)}
    </span>
  )
}
