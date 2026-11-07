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
const userDetailsListeners = new Map<string, Set<() => void>>()

const normalizeUsername = (username?: string | null) => username?.trim() || null

const notifyUserDetails = (username: string) => {
  const listeners = userDetailsListeners.get(username)
  if (!listeners) return

  listeners.forEach((listener) => listener())
}

export const syncUserDetails = (username?: string | null, nextUser?: UserDetails | null) => {
  const normalized = normalizeUsername(username)
  if (!normalized) return

  userDetailsCache.delete(normalized)
  userDetailsStore.set(normalized, nextUser ?? null)
  notifyUserDetails(normalized)
}

export const invalidateUserDetails = (username?: string | null) => {
  const normalized = normalizeUsername(username)
  if (!normalized) return

  userDetailsCache.delete(normalized)
  userDetailsStore.delete(normalized)
  notifyUserDetails(normalized)
}

export const useUserDetails = (username?: string | null) => {
  const safeUsername = normalizeUsername(username)

  const [user, setUser] = useState<UserDetails | null>(() => {
    if (!safeUsername) return null
    return userDetailsStore.get(safeUsername) ?? null
  })

  const [loading, setLoading] = useState(() => !!safeUsername && !userDetailsStore.has(safeUsername))

  const refresh = useCallback(async (force = false) => {
    if (!safeUsername) {
      setUser(null)
      setLoading(false)
      return null
    }

    const cached = userDetailsStore.get(safeUsername)
    if (!force && cached !== undefined) {
      setUser(cached)
      notifyUserDetails(safeUsername)
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
      notifyUserDetails(safeUsername)
      return nextUser
    } catch {
      userDetailsStore.set(safeUsername, null)
      setUser(null)
      notifyUserDetails(safeUsername)
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

  useEffect(() => {
    if (!safeUsername) return

    const syncCurrentUser = () => {
      setUser(userDetailsStore.get(safeUsername) ?? null)
    }

    const listeners = userDetailsListeners.get(safeUsername) ?? new Set<() => void>()
    listeners.add(syncCurrentUser)
    userDetailsListeners.set(safeUsername, listeners)

    return () => {
      const current = userDetailsListeners.get(safeUsername)
      if (!current) return
      current.delete(syncCurrentUser)
      if (current.size === 0) {
        userDetailsListeners.delete(safeUsername)
      }
    }
  }, [safeUsername])

  const syncUser = useCallback(
    (nextUser?: UserDetails | null) => {
      if (!safeUsername) return

      syncUserDetails(safeUsername, nextUser ?? null)
      setUser(nextUser ?? null)
    },
    [safeUsername],
  )

  return { user, loading, refresh, syncUser }
}
