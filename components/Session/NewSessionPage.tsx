import type * as React from 'react'
import { useEffect, useState, type ChangeEvent } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

import { SessionField, SessionInput } from '@/components/Session/SessionField'
import { getFormattedDateTime } from '@/util/functions'
import type { TopicConflictError } from '@/types'

const NewSessionPage = () => {
  const { data: session } = useSession()
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState('')
  const [topic, setTopic] = useState('')
  const [topicId, setTopicId] = useState<string | null>(null)
  const [timer, setTimer] = useState(60)
  const [defaultTimerForUser, setDefaultTimerForUser] = useState(60)
  const [sessionTimerOverrideEnabled, setSessionTimerOverrideEnabled] = useState(false)
  const [replaceTopicOnTimeout, setReplaceTopicOnTimeout] = useState(false)
  const [allowOvertime, setAllowOvertime] = useState(false)
  const [autofillSessionName, setAutofillSessionName] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const querySessionName = typeof router.query.sessionName === 'string' ? router.query.sessionName : ''
  const queryTopic = typeof router.query.topic === 'string' ? router.query.topic : ''
  const queryTopicId = typeof router.query.topicId === 'string' ? router.query.topicId : null
  const queryTimer = Number(router.query.timer)
  const queryReplaceTopicOnTimeout = router.query.replaceTopicOnTimeout === 'true'
  const queryAllowOvertime = router.query.allowOvertime === 'true'

  const generateSessionName = () => {
    const adjectives = ['Bold', 'Collected', 'Calm', 'Confident', 'Focused', 'Strong', 'Steady', 'Clear', 'Brave']
    const nounPool = ['Practice', 'Session', 'Focus', 'Reset', 'Response', 'Progress', 'Moment', 'Flow']

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nounPool[Math.floor(Math.random() * nounPool.length)]

    const displayName = `${adjective} ${noun} ${getFormattedDateTime()}`
    setSessionName(displayName)
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

  useEffect(() => {
    if (!router.isReady) return

    const nextTimerValue = Number.isFinite(queryTimer) && queryTimer > 0 ? queryTimer : null

    if (querySessionName || queryTopic || queryTopicId || nextTimerValue !== null || queryReplaceTopicOnTimeout || queryAllowOvertime) {
      setSessionName(querySessionName)
      setTopic(queryTopic)
      setTopicId(queryTopicId)
      setTimer(nextTimerValue ?? 60)
      setReplaceTopicOnTimeout(queryReplaceTopicOnTimeout)
      setAllowOvertime(queryAllowOvertime)
      setSessionTimerOverrideEnabled(nextTimerValue !== null)
      return
    }

    const fetchUserId = async () => {
      if (session?.user?.name) {
        const res = await axios.get(`/api/users?username=${session.user.name}`)
        setUserId(res?.data?._id)

        const nextTimer = Number(res?.data?.settings?.defaultTimer ?? 60)
        const nextDefault = Number.isFinite(nextTimer) && nextTimer > 0 ? nextTimer : 60

        setDefaultTimerForUser(nextDefault)
        setTimer(nextDefault)
        setSessionTimerOverrideEnabled(false)
        setReplaceTopicOnTimeout(Boolean(res?.data?.settings?.replaceTopicOnTimeout))
        setAllowOvertime(Boolean(res?.data?.settings?.allowOvertime))
        setAutofillSessionName(Boolean(res?.data?.settings?.autofillSessionName))
      }
    }

    fetchUserId()
  }, [router.isReady, querySessionName, queryTopic, queryTopicId, queryTimer, queryReplaceTopicOnTimeout, queryAllowOvertime, session])

  useEffect(() => {
    if (!router.isReady || !autofillSessionName || querySessionName || sessionName) return

    generateSessionName()
  }, [router.isReady, autofillSessionName, querySessionName, sessionName, topic])

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
