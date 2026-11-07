import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'

import type { UserSettings } from '@/types'

export interface UserLibraryEntry {
  avatarSvg?: string
  seed?: string
}

export interface UserDetails {
  _id?: string
  username?: string | null
  email?: string | null
  avatarImgUrl?: string | null
  settings?: Partial<UserSettings>
  library?: {
    userAvatars?: UserLibraryEntry[]
  }
  [key: string]: unknown
}

const userDetailsCache = new Map<string, Promise<UserDetails | null>>()
const userDetailsStore = new Map<string, UserDetails | null>()

const normalizeUsername = (username?: string | null) => username?.trim() || null

export const useUserDetails = (username?: string | null) => {
  const safeUsername = normalizeUsername(username)

  const [user, setUser] = useState<UserDetails | null>(() => {
    if (!safeUsername) return null
    return userDetailsStore.get(safeUsername) ?? null
  })

  const [loading, setLoading] = useState(() => !!safeUsername && !userDetailsStore.has(safeUsername))

  const refresh = useCallback(async () => {
    if (!safeUsername) {
      setUser(null)
      setLoading(false)
      return null
    }

    const cached = userDetailsStore.get(safeUsername)
    if (cached !== undefined) {
      setUser(cached)
      setLoading(false)
      return cached
    }

    const existingPromise = userDetailsCache.get(safeUsername)
    const request =
      existingPromise ??
      axios
        .get(`/api/users?username=${encodeURIComponent(safeUsername)}`)
        .then((res) => (res?.data ?? null) as UserDetails | null)
        .catch(() => null)

    if (!existingPromise) {
      userDetailsCache.set(safeUsername, request)
    }

    setLoading(true)

    try {
      const nextUser = await request
      userDetailsStore.set(safeUsername, nextUser)
      setUser(nextUser)
      return nextUser
    } catch {
      userDetailsStore.set(safeUsername, null)
      setUser(null)
      return null
    } finally {
      userDetailsCache.delete(safeUsername)
      setLoading(false)
    }
  }, [safeUsername])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!safeUsername) {
      setUser(null)
      setLoading(false)
      return
    }

    const cached = userDetailsStore.get(safeUsername)
    if (cached !== undefined) {
      setUser(cached)
      setLoading(false)
      return
    }

    void refresh()
  }, [refresh, safeUsername])
  /* eslint-enable react-hooks/set-state-in-effect */

  return { user, loading, refresh }
}
