import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createTicket } from '@/api/tickets.api'
import { ErrorMessage } from '@/components/ErrorMessage'
import { UserSelect } from '@/components/UserSelect'
import { useMutation } from '@/hooks/useMutation'
import { useUsers } from '@/hooks/useUsers'
import { ApiClientError } from '@/types'
import type { Priority } from '@/types'

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export function CreateTicketPage(): React.ReactElement {
  const navigate = useNavigate()
  const { users, loading: usersLoading, error: usersError } = useUsers()
  const { mutate, loading, error, reset } = useMutation(createTicket)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [createdById, setCreatedById] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [localError, setLocalError] = useState<ApiClientError | null>(null)

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault()
    setLocalError(null)
    reset()

    if (!title.trim()) {
      setLocalError(
        new ApiClientError('VALIDATION_ERROR', 'Title is required', 400)
      )
      return
    }
    if (!createdById) {
      setLocalError(
        new ApiClientError(
          'VALIDATION_ERROR',
          'Please select who is creating the ticket',
          400
        )
      )
      return
    }

    const ticket = await mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      createdById,
      assignedToId: assignedToId || undefined,
    })

    if (ticket) {
      void navigate(`/tickets/${ticket.id}`)
    }
  }

  return (
    <div className="page page-narrow">
      <p className="back-link">
        <Link to="/">← Tickets</Link>
      </p>
      <header className="page-header">
        <h1>Create ticket</h1>
      </header>

      <form className="panel form-stack" onSubmit={(e) => void handleSubmit(e)}>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          className="field-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          required
        />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          className="field-textarea"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />

        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          className="field-select"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          disabled={loading}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <label htmlFor="createdBy">Created by</label>
        <UserSelect
          id="createdBy"
          users={users}
          value={createdById}
          onChange={setCreatedById}
          disabled={usersLoading || loading}
          allowEmpty
          emptyLabel={usersLoading ? 'Loading users…' : 'Select user…'}
          required
        />

        <label htmlFor="assignee">Assignee (optional)</label>
        <UserSelect
          id="assignee"
          users={users}
          value={assignedToId}
          onChange={setAssignedToId}
          disabled={usersLoading || loading}
          allowEmpty
          emptyLabel="Unassigned"
        />

        <ErrorMessage error={localError ?? error ?? usersError} />

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create ticket'}
          </button>
          <Link to="/" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
