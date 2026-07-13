import { Link } from 'react-router-dom'
import { ErrorMessage } from '@/components/ErrorMessage'
import { TicketCard } from '@/components/TicketCard'
import { useTickets } from '@/hooks/useTickets'
import { formatStatusLabel } from '@/lib/status-transitions'
import type { TicketStatus } from '@/types'

const STATUS_OPTIONS: Array<TicketStatus | ''> = [
  '',
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'CANCELLED',
]

export function TicketListPage(): React.ReactElement {
  const {
    tickets,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
  } = useTickets()

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">TMS</p>
          <h1>Tickets</h1>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">
          New ticket
        </Link>
      </header>

      <div className="toolbar">
        <input
          type="search"
          className="field-input"
          placeholder="Search title or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search tickets"
        />
        <select
          className="field-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as TicketStatus | '')}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option || 'all'} value={option}>
              {option === '' ? 'All statuses' : formatStatusLabel(option)}
            </option>
          ))}
        </select>
      </div>

      <ErrorMessage error={error} />

      {loading ? <p className="muted">Loading tickets…</p> : null}

      {!loading && !error && tickets.length === 0 ? (
        <p className="muted">No tickets match your filters.</p>
      ) : null}

      <div className={`ticket-list${loading ? ' ticket-list-loading' : ''}`}>
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  )
}
