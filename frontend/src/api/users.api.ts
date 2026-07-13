import { fetchJson } from '@/api/client'
import type { User } from '@/types'

export function listUsers(): Promise<User[]> {
  return fetchJson<User[]>('/api/users')
}
