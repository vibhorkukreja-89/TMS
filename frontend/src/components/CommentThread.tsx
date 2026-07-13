import { useState } from 'react'
import { ErrorMessage } from '@/components/ErrorMessage'
import { UserSelect } from '@/components/UserSelect'
import { ApiClientError } from '@/types'
import type { Comment, User } from '@/types'

interface CommentThreadProps {
  comments: Comment[]
  users: User[]
  usersLoading: boolean
  submitting: boolean
  error: ApiClientError | null
  onSubmit: (input: {
    message: string
    createdById: string
  }) => Promise<boolean>
}

export function CommentThread({
  comments,
  users,
  usersLoading,
  submitting,
  error,
  onSubmit,
}: CommentThreadProps): React.ReactElement {
  const [message, setMessage] = useState('')
  const [createdById, setCreatedById] = useState('')
  const [localError, setLocalError] = useState<ApiClientError | null>(null)

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault()
    setLocalError(null)

    if (!message.trim()) {
      setLocalError(
        new ApiClientError('VALIDATION_ERROR', 'Comment message is required', 400)
      )
      return
    }
    if (!createdById) {
      setLocalError(
        new ApiClientError(
          'VALIDATION_ERROR',
          'Please select who is posting the comment',
          400
        )
      )
      return
    }

    const ok = await onSubmit({ message: message.trim(), createdById })
    if (ok) {
      setMessage('')
    }
  }

  return (
    <section className="panel comment-thread">
      <h2>Comments</h2>

      {comments.length === 0 ? (
        <p className="muted">No comments yet.</p>
      ) : (
        <ul className="comment-list">
          {comments.map((comment) => (
            <li key={comment.id} className="comment-item">
              <div className="comment-header">
                <strong>{comment.createdBy.name}</strong>
                <time dateTime={comment.createdAt}>
                  {new Date(comment.createdAt).toLocaleString()}
                </time>
              </div>
              <p>{comment.message}</p>
            </li>
          ))}
        </ul>
      )}

      <form className="comment-form" onSubmit={(e) => void handleSubmit(e)}>
        <label htmlFor="comment-message">Add a comment</label>
        <textarea
          id="comment-message"
          className="field-textarea"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
        />

        <label htmlFor="comment-author">Posted by</label>
        <UserSelect
          id="comment-author"
          users={users}
          value={createdById}
          onChange={setCreatedById}
          disabled={usersLoading || submitting}
          allowEmpty
          emptyLabel={usersLoading ? 'Loading users…' : 'Select user…'}
          required
        />

        <ErrorMessage error={localError ?? error} />

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post comment'}
        </button>
      </form>
    </section>
  )
}
