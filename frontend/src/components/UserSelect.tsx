import type { User } from '@/types'

interface UserSelectProps {
  users: User[]
  value: string
  onChange: (userId: string) => void
  id?: string
  disabled?: boolean
  allowEmpty?: boolean
  emptyLabel?: string
  required?: boolean
}

export function UserSelect({
  users,
  value,
  onChange,
  id,
  disabled = false,
  allowEmpty = false,
  emptyLabel = 'Select user…',
  required = false,
}: UserSelectProps): React.ReactElement {
  return (
    <select
      id={id}
      className="field-select"
      value={value}
      disabled={disabled}
      required={required}
      onChange={(e) => onChange(e.target.value)}
    >
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.name} ({user.role})
        </option>
      ))}
    </select>
  )
}
