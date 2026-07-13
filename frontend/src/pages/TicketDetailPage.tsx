import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  addComment,
  changeTicketStatus,
  updateTicket,
} from '@/api/tickets.api'
import { CommentThread } from '@/components/CommentThread'
import { ErrorMessage } from '@/components/ErrorMessage'
import { StatusBadge } from '@/components/StatusBadge'
import { StatusControl } from '@/components/StatusControl'
import { UserSelect } from '@/components/UserSelect'
import { useMutation } from '@/hooks/useMutation'
import { useTicketDetail } from '@/hooks/useTicketDetail'
import { useUsers } from '@/hooks/useUsers'
import { ApiClientError } from '@/types'
import type { Priority, TicketStatus } from '@/types'

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export function TicketDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>()
  const { ticket, comments, loading, error, refetch } = useTicketDetail(id)
  const { users, loading: usersLoading } = useUsers()

  const updateMutation = useMutation(
    (input: {
      ticketId: string
      title: string
      description: string
      priority: Priority
      assignedToId: string | null
    }) =>
      updateTicket(input.ticketId, {
        title: input.title,
        description: input.description || null,
        priority: input.priority,
        assignedToId: input.assignedToId,
      })
  )

  const statusMutation = useMutation(
    (input: { ticketId: string; status: TicketStatus }) =>
      changeTicketStatus(input.ticketId, input.status)
  )

  const commentMutation = useMutation(
    (input: { ticketId: string; message: string; createdById: string }) =>
      addComment(input.ticketId, {
        message: input.message,
        createdById: input.createdById,
      })
  )

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [assignedToId, setAssignedToId] = useState('')
  const [localError, setLocalError] = useState<ApiClientError | null>(null)

  useEffect(() => {
    if (!ticket) return
    setTitle(ticket.title)
    setDescription(ticket.description ?? '')
    setPriority(ticket.priority)
    setAssignedToId(ticket.assignedToId ?? '')
  }, [ticket])

  if (!id) {
    return (
      <div className="page">
        <p className="back-link">
          <Link to="/">← Tickets</Link>
        </p>
        <ErrorMessage
          error={new ApiClientError('NOT_FOUND', 'Ticket not found', 404)}
        />
      </div>
    )
  }

  const ticketId = id

  async function handleSave(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault()
    setLocalError(null)
    updateMutation.reset()

    if (!title.trim()) {
      setLocalError(
        new ApiClientError('VALIDATION_ERROR', 'Title is required', 400)
      )
      return
    }

    const updated = await updateMutation.mutate({
      ticketId,
      title: title.trim(),
      description: description.trim(),
      priority,
      assignedToId: assignedToId || null,
    })
    if (updated) await refetch()
  }

  async function handleStatusChange(status: TicketStatus): Promise<void> {
    statusMutation.reset()
    const updated = await statusMutation.mutate({ ticketId, status })
    if (updated) await refetch()
  }

  async function handleCommentSubmit(input: {
    message: string
    createdById: string
  }): Promise<boolean> {
    commentMutation.reset()
    const created = await commentMutation.mutate({
      ticketId,
      ...input,
    })
    if (created) {
      await refetch()
      return true
    }
    return false
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading ticket…</p>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="page">
        <p className="back-link">
          <Link to="/">← Tickets</Link>
        </p>
        <ErrorMessage
          error={
            error ??
            new ApiClientError('NOT_FOUND', 'Ticket not found', 404)
          }
        />
      </div>
    )
  }

  return (
    <div className="page">
      <p className="back-link">
        <Link to="/">← Tickets</Link>
      </p>

      <header className="page-header">
        <div>
          <p className="eyebrow">Ticket</p>
          <h1>{ticket.title}</h1>
        </div>
      </header>

      <div className="detail-split">
        <div className="detail-main">
          <form
            className="panel form-stack"
            onSubmit={(e) => void handleSave(e)}
          >
            <h2>Details</h2>

            <label htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              className="field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={updateMutation.loading}
            />

            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              className="field-textarea"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={updateMutation.loading}
            />

            <label htmlFor="edit-priority">Priority</label>
            <select
              id="edit-priority"
              className="field-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              disabled={updateMutation.loading}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <label htmlFor="edit-assignee">Assignee</label>
            <UserSelect
              id="edit-assignee"
              users={users}
              value={assignedToId}
              onChange={setAssignedToId}
              disabled={usersLoading || updateMutation.loading}
              allowEmpty
              emptyLabel="Unassigned"
            />

            <p className="muted">
              Created by {ticket.createdBy.name} · Created{' '}
              {new Date(ticket.createdAt).toLocaleString()} · Updated{' '}
              {new Date(ticket.updatedAt).toLocaleString()}
            </p>

            <ErrorMessage error={localError ?? updateMutation.error} />

            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateMutation.loading}
            >
              {updateMutation.loading ? 'Saving…' : 'Save changes'}
            </button>
          </form>

          <CommentThread
            comments={comments}
            users={users}
            usersLoading={usersLoading}
            submitting={commentMutation.loading}
            error={commentMutation.error}
            onSubmit={handleCommentSubmit}
          />
        </div>

        <aside className="detail-side panel">
          <h2>Status</h2>
          <div className="status-current">
            <StatusBadge status={ticket.status} />
          </div>
          <StatusControl
            currentStatus={ticket.status}
            disabled={statusMutation.loading}
            onChange={(nextStatus) => void handleStatusChange(nextStatus)}
          />
          <ErrorMessage error={statusMutation.error} />
        </aside>
      </div>
    </div>
  )
}
