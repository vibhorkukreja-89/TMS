import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/StatusBadge'
import type { Ticket } from '@/types'

interface TicketCardProps {
  ticket: Ticket
}

export function TicketCard({ ticket }: TicketCardProps): React.ReactElement {
  return (
    <Link to={`/tickets/${ticket.id}`} className="ticket-row">
      <div className="ticket-row-main">
        <span className="ticket-row-title">{ticket.title}</span>
        <span className="ticket-row-meta">
          {ticket.assignedTo?.name ?? 'Unassigned'}
          {' · '}
          {new Date(ticket.updatedAt).toLocaleString()}
        </span>
      </div>
      <div className="ticket-row-side">
        <StatusBadge status={ticket.status} />
        <span className={`priority-label priority-${ticket.priority.toLowerCase()}`}>
          {ticket.priority}
        </span>
      </div>
    </Link>
  )
}
