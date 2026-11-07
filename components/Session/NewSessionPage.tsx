import type * as React from 'react'
import { useEffect, useState, type ChangeEvent } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

import { SessionField, SessionInput } from '@/components/Session/SessionField'
import { useUserDetails } from '@/hooks/useUserDetails'
import { getFormattedDateTime } from '@/util/functions'
import type { TopicConflictError } from '@/types'

const NewSessionPage = () => {
  const { data: session, status } = useSession()
  const { user } = useUserDetails(session?.user?.name)
  const router = useRouter()

  const querySessionName = typeof router.query.sessionName === 'string' ? router.query.sessionName : ''
  const queryTopic = typeof router.query.topic === 'string' ? router.query.topic : ''
  const queryTopicId = typeof router.query.topicId === 'string' ? router.query.topicId : null
  const queryTimer = Number(router.query.timer)
  const queryReplaceTopicOnTimeout = router.query.replaceTopicOnTimeout === 'true'
  const queryAllowOvertime = router.query.allowOvertime === 'true'
  const queryTimerValue = Number.isFinite(queryTimer) && queryTimer > 0 ? queryTimer : null
  const hasQueryOverrides = Boolean(
    querySessionName || queryTopic || queryTopicId || queryTimerValue !== null || queryReplaceTopicOnTimeout || queryAllowOvertime,
  )

  const getGeneratedSessionName = () => {
    const adjectives = ['Bold', 'Collected', 'Calm', 'Confident', 'Focused', 'Strong', 'Steady', 'Clear', 'Brave']
    const nounPool = ['Practice', 'Session', 'Focus', 'Reset', 'Response', 'Progress', 'Moment', 'Flow']

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nounPool[Math.floor(Math.random() * nounPool.length)]

    return `${adjective} ${noun} ${getFormattedDateTime()}`
  }

  const [sessionName, setSessionName] = useState(() => querySessionName || '')
  const [topic, setTopic] = useState(() => queryTopic || '')
  const [topicId, setTopicId] = useState<string | null>(() => queryTopicId)
  const [timer, setTimer] = useState(() => queryTimerValue ?? 60)
  const [defaultTimerForUser, setDefaultTimerForUser] = useState(60)
  const [sessionTimerOverrideEnabled, setSessionTimerOverrideEnabled] = useState(() => queryTimerValue !== null)
  const [replaceTopicOnTimeout, setReplaceTopicOnTimeout] = useState(() => queryReplaceTopicOnTimeout)
  const [allowOvertime, setAllowOvertime] = useState(() => queryAllowOvertime)
  const [isStarting, setIsStarting] = useState(false)

  const generateSessionName = () => {
    setSessionName(getGeneratedSessionName())
  }

  const setRandomTopic = async () => {
    const res = await axios.get('/api/topics/random')
    setTopic(res?.data?.topic?.name)
    setTopicId(res?.data?.topic?._id)
  }

  const handleTopicChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTopic(event.target.value)
    setTopicId(null)
  }

  const resolveTopicId = async (): Promise<string | null> => {
    if (!topic || topic === '') return null
    if (topicId) return topicId

    try {
      const res = await axios.post('/api/topics', { name: topic })
      return res?.data?.topic._id ?? null
    } catch (error: unknown) {
      const topicError = error as TopicConflictError

      if (topicError?.response?.status === 409) {
        return topicError.response?.data?.topic?._id ?? null
      }

      console.error('Failed to create/resolve topic:', error)
      return null
    }
  }

  const handleStartClick = async () => {
    if (!sessionName) return
    setIsStarting(true)

    try {
      const resolvedTopicId = await resolveTopicId()
      const params = new URLSearchParams()
      if (resolvedTopicId) params.set('topicId', resolvedTopicId)
      params.set('timer', String(timer))
      params.set('replaceTopicOnTimeout', String(replaceTopicOnTimeout))
      params.set('allowOvertime', String(allowOvertime))

      await router.push(`/session/${encodeURIComponent(sessionName)}?${params.toString()}`)
    } catch (error) {
      console.error('Failed to start session:', error)
    } finally {
      setIsStarting(false)
    }
  }

  const handleTimerChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value

    if (rawValue === '') {
      setTimer(0)
      return
    }

    const nextTimer = Number(rawValue)
    if (!Number.isFinite(nextTimer)) return

    setTimer(Math.min(Math.max(nextTimer, 0), 120))
  }

  const handleTimerKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && timer === 0) {
      event.preventDefault()
      setTimer(0)
      return
    }

    if (event.key >= '0' && event.key <= '9' && timer === 0) {
      event.preventDefault()
      setTimer(Number(event.key))
    }
  }

  const updateSessionTimerOverride = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked
    setSessionTimerOverrideEnabled(checked)
    if (!checked) {
      setTimer(defaultTimerForUser)
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!router.isReady || hasQueryOverrides || !session?.user?.name || !user?.settings) return

    const nextTimer = Number(user.settings?.defaultTimer ?? 60)
    const nextDefault = Number.isFinite(nextTimer) && nextTimer > 0 ? nextTimer : 60
    const nextAutofill = Boolean(user.settings?.autofillSessionName)

    setDefaultTimerForUser(nextDefault)
    setTimer(nextDefault)
    setSessionTimerOverrideEnabled(false)
    setReplaceTopicOnTimeout(Boolean(user.settings?.replaceTopicOnTimeout))
    setAllowOvertime(Boolean(user.settings?.allowOvertime))

    if (nextAutofill && !sessionName) {
      setSessionName(getGeneratedSessionName())
    }
  }, [hasQueryOverrides, router.isReady, session?.user?.name, sessionName, user?.settings])
  /* eslint-enable react-hooks/set-state-in-effect */

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <main className="mt-20 flex h-full flex-col items-center justify-start">
          <div className="flex min-h-[320px] items-center justify-center gap-4">
            {[0, 1, 2].map((index) => (
              <span
                key={`new-session-loading-${index}`}
                className="h-4 w-4 rounded-full bg-[#4ec7b4] animate-pulse"
                style={{ animationDelay: `${index * 150}ms` }}
              />
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <main className="mt-20 flex h-full flex-col items-center justify-start">
          <p className="m-2 p-3 text-center text-4xl text-white">Sign In to start practicing!</p>
          <Image loading="eager" src="/images/logo.webp" alt="App logo" height={500} width={500} />
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <main className="mt-20 flex h-full flex-col items-center justify-start">
        <div id="top-content" className="flex flex-col items-center justify-start">
          <h1 className="text-3xl font-bold text-primary">New Session</h1>
          <div id="inputs" className="flex min-w-[400px] flex-col items-center justify-center p-3 text-white">
            <SessionField label="Session Name:" helperText="Generate Random →" onHelperClick={generateSessionName}>
              <SessionInput value={sessionName} onChange={(e) => setSessionName(e.target.value)} />
            </SessionField>

            <SessionField label="Topic:" helperText="Generate Random →" onHelperClick={setRandomTopic}>
              <SessionInput value={topic} onChange={handleTopicChange} />
            </SessionField>

            <SessionField label="Timer:">
              <SessionInput
                value={timer}
                type="number"
                max={120}
                onChange={handleTimerChange}
                onKeyDown={handleTimerKeyDown}
                disabled={!sessionTimerOverrideEnabled}
                className="w-1/2 rounded-md bg-gray p-1 px-2 text-black disabled:cursor-not-allowed disabled:opacity-50"
              />
            </SessionField>

            <div className="w-full pb-1 pt-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
              Session override settings
            </div>

            <div className="setting flex w-full items-center justify-center pt-1 text-sm">
              <p>Use custom timer for this session</p>
              <input
                checked={sessionTimerOverrideEnabled}
                onChange={updateSessionTimerOverride}
                type="checkbox"
                className="mx-2 rounded-md bg-gray"
              />
            </div>

            <div className="setting flex w-full items-center justify-center pt-1 text-sm">
              <p>Replace topic when time runs out</p>
              <input
                checked={replaceTopicOnTimeout}
                onChange={(event) => setReplaceTopicOnTimeout(event.target.checked)}
                type="checkbox"
                className="mx-2 rounded-md bg-gray"
              />
            </div>

            <div className="setting flex w-full items-center justify-center pt-1 text-sm">
              <p>Allow recording to continue past the timer</p>
              <input
                checked={allowOvertime}
                onChange={(event) => setAllowOvertime(event.target.checked)}
                type="checkbox"
                className="mx-2 rounded-md bg-gray"
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 flex w-full items-center justify-between border-t border-gray px-4 py-2">
          <button
            type="button"
            className="rounded-md bg-white px-4 py-2 font-bold text-black"
            onClick={() => router.push('/')}
          >
            ← Back
          </button>
          <button
            type="button"
            className={`rounded-md bg-primary px-4 py-2 font-bold text-black ${isStarting || !sessionName || timer <= 0 ? 'cursor-not-allowed opacity-50' : ''}`}
            disabled={isStarting || !sessionName || timer <= 0}
            onClick={handleStartClick}
          >
            {isStarting ? 'Starting...' : 'Start'}
          </button>
        </div>
      </main>
    </div>
  )
}

export default NewSessionPage
