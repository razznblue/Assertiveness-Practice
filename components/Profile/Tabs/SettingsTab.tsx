import { useEffect, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import axios from 'axios'
import { useSession } from 'next-auth/react'

import type { UserSettings } from '@/types'

const defaultSettings: UserSettings = {
  defaultTimer: 60,
  autofillSessionName: false,
  replaceTopicOnTimeout: false,
  allowOvertime: false,
}

const SettingsTab = () => {
  const { data: session } = useSession()
  const [userId, setUserId] = useState<string | null>(null)
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [saving, setSaving] = useState(false)

  useEffect(() => {

    console.log('FETCH SETTINGS EFFECT RAN')
const fetchSettings = async () => {
  if (!session?.user?.name) return

  console.log('Fetching settings from database...')

  try {
    const res = await axios.get(
      `/api/users?username=${session.user.name}`
    )

    const nextSettings: UserSettings = {
      defaultTimer: Number(res.data.settings?.defaultTimer ?? 60),
      autofillSessionName: Boolean(res.data.settings?.autofillSessionName),
      replaceTopicOnTimeout: Boolean(res.data.settings?.replaceTopicOnTimeout),
      allowOvertime: Boolean(res.data.settings?.allowOvertime),
    }

    console.log('Settings received from API:', nextSettings)

    setUserId(res?.data?._id ?? null)
    setSettings(nextSettings)
  } catch (error) {
    console.error('Failed to load user settings:', error)
  }
}

    fetchSettings()
  }, [session?.user?.name])

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    console.log('Updating setting:', key, value)

    setSettings((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleDefaultTimerChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value

    if (rawValue === '') {
      updateSetting('defaultTimer', 0)
      return
    }

    const nextTimer = Number(rawValue)
    if (!Number.isFinite(nextTimer)) return

    updateSetting('defaultTimer', Math.min(Math.max(nextTimer, 0), 180))
  }

  const handleDefaultTimerKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && (settings.defaultTimer ?? 0) === 0) {
      event.preventDefault()
      updateSetting('defaultTimer', 0)
      return
    }

    if (event.key >= '0' && event.key <= '9' && (settings.defaultTimer ?? 0) === 0) {
      event.preventDefault()
      updateSetting('defaultTimer', Number(event.key))
    }
  }

  useEffect(() => {
    console.log('Settings state updated:', settings)
  }, [settings])

const saveSettings = async () => {
  if (!userId || !session?.user?.name) return

  setSaving(true)

  try {
    console.log('Settings being sent:', JSON.stringify(settings))

    const res = await axios.patch(`/api/users/${userId}`, {
      settings: {
        defaultTimer: settings.defaultTimer,
        autofillSessionName: settings.autofillSessionName,
        replaceTopicOnTimeout: settings.replaceTopicOnTimeout,
        allowOvertime: settings.allowOvertime,
      },
    })

    console.log('Settings PATCH response:', res.data)

  } catch (error) {
    console.error('Failed to save settings:', error)
  } finally {
    setSaving(false)
  }
}

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#2d4054] p-5 text-slate-200">
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Global preferences
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between gap-4">
            <span className="text-base text-white">Default session timer (In seconds)</span>
            <input
              type="number"
              min={15}
              max={180}
              value={settings.defaultTimer ?? 0}
              onChange={handleDefaultTimerChange}
              onKeyDown={handleDefaultTimerKeyDown}
              className="w-24 rounded-md border border-white/10 bg-[#1f2f3d] px-3 py-2 text-right text-white"
            />
          </label>

          <label className="flex items-center justify-between gap-4">
            <span className="text-base text-white">Auto-fill session names</span>
            <input
              type="checkbox"
              checked={Boolean(settings.autofillSessionName)}
              onChange={(event) => updateSetting('autofillSessionName', event.target.checked)}
              className="h-5 w-5"
            />
          </label>

          <label className="flex items-center justify-between gap-4">
            <span className="text-base text-white">Replace topic when time runs out</span>
            <input
              type="checkbox"
              checked={Boolean(settings.replaceTopicOnTimeout)}
              onChange={(event) => updateSetting('replaceTopicOnTimeout', event.target.checked)}
              className="h-5 w-5"
            />
          </label>

          <label className="flex items-center justify-between gap-4">
            <span className="text-base text-white">Allow recordings to go past the timer</span>
            <input
              type="checkbox"
              checked={Boolean(settings.allowOvertime)}
              onChange={(event) => updateSetting('allowOvertime', event.target.checked)}
              className="h-5 w-5"
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={saveSettings}
        disabled={!userId || saving}
        className="rounded-xl bg-[#4ec7b4] px-5 py-3 font-semibold text-[#0A192F] transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save settings'}
      </button>
    </div>
  )
}

export default SettingsTab
