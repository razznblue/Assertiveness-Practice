import Button from '@/components/button/Button'
import { useState, useEffect, type ChangeEvent } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import axios from 'axios'
import { useRouter } from 'next/router'

export default function NewSession() {
  const { data: session } = useSession()
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState('')
  const [topic, setTopic] = useState('')
  const [topicId, setTopicId] = useState<string | null>(null)
  const [timer, setTimer] = useState(60)
  const [timerChecked, setTimerChekced] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const generateSessionName = () => {
    const baseTopic = (topic || 'Practice').replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
    const cleanedTopic = baseTopic
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    const adjectives = ['Bold', 'Calm', 'Confident', 'Focused', 'Strong', 'Steady', 'Clear', 'Brave']
    const nounPool = ['Practice', 'Session', 'Focus', 'Reset', 'Response', 'Progress', 'Moment', 'Flow']

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nounPool[Math.floor(Math.random() * nounPool.length)]
    const finalTopic = cleanedTopic || noun

    const displayName = `${adjective} ${finalTopic}`
    setSessionName(displayName)
  }

  const setRandomTopic = async () => {
    const res = await axios.get('/api/topics/random')
    setTopic(res?.data?.topic?.name)
    setTopicId(res?.data?.topic?._id)
  }

  // Clear topicId whenever the user manually edits the topic name
  // since it may no longer match what's in the DB
  const handleTopicChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value)
    setTopicId(null)
  }

  const resolveTopicId = async (): Promise<string | null> => {
    if (!topic || topic === '') return null
    if (topicId) return topicId

    try {
      // Try to create; if it already exists your API should return the existing doc
      const res = await axios.post('/api/topics', { name: topic })
      return res?.data?.topic._id ?? null
    } catch (e) {
      if (e?.response?.status === 409) {
        // Topic exists — API now returns it under `topic`
        return e?.response?.data?.topic?._id ?? null
      }
      console.error('Failed to create/resolve topic:', e)
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

      // Navigate programmatically only after topic is resolved
      await router.push(`/session/${encodeURIComponent(sessionName)}?${params.toString()}`)
    } catch (e) {
      console.error('Failed to start session:', e)
    } finally {
      setIsStarting(false)
    }
  }

  const handleTimerChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const nextTimer = Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : 60
    setTimer(nextTimer)

    if (timerChecked && userId) {
      await axios.patch(`/api/users/${userId}`, { settings: { defaultTimer: nextTimer } })
    }
  }

  const updateTimerPreference = async (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setTimerChekced(checked)
    if (checked && !Number.isNaN(timer) && userId) {
      await axios.patch(`/api/users/${userId}`, { settings: { defaultTimer: timer } })
    }
  }

  /* Fecth UserId */
  useEffect(() => {
    const fetchUserId = async () => {
      if (session?.user?.name) {
        const res = await axios.get(`/api/users?username=${session?.user?.name}`)
        setUserId(res?.data?._id)
        setTimer(res?.data?.settings?.defaultTimer)
      }
    }
    fetchUserId()
  }, [session])

  return (
    <div className="flex items-center justify-center h-screen">
      <main className="flex flex-col items-center justify-start mt-20 h-full">
        {!session ? (
          <>
            <p className="text-white p-3 m-2 text-4xl text-center">Sign In to start practicing!</p>
            <Image loading='eager' src="/images/logo.webp" alt="" height="500" width="500" />
          </>
        ) : (
          <>
            <div id="top-content" className="flex flex-col items-center justify-start">
              <h1 className="text-primary text-3xl font-bold">New Session</h1>
              <div
                id="inputs"
                className="flex flex-col items-center justify-center p-3 text-white min-w-[400px]"
              >
                <div className="input flex flex-col items-center p-2 w-full">
                  <div className="flex items-center justify-end w-full">
                    <p className="px-2 font-bold text-xl">Session Name: </p>
                    <input
                      type="text"
                      value={sessionName}
                      onChange={(e) => setSessionName(e?.target?.value)}
                      className="bg-gray rounded-md w-1/2 text-black p-1 px-2"
                    />
                  </div>
                  <p onClick={generateSessionName} className="text-sm pt-1 cursor-pointer">
                    Generate Random →
                  </p>
                </div>
                <div className="input flex flex-col items-center p-2 w-full">
                  <div className="flex items-center justify-end w-full">
                    <p className="px-2 font-bold text-xl">Topic: </p>
                    <input
                      type="text"
                      value={topic}
                      onChange={handleTopicChange}
                      className="bg-gray rounded-md w-1/2 text-black p-1 px-2"
                    />
                  </div>
                  <p onClick={setRandomTopic} className="text-sm pt-1 cursor-pointer">
                    Generate Random →
                  </p>
                </div>
                <div className="input flex flex-col items-center p-2 w-full">
                  <div className="flex items-center justify-end w-full">
                    <p className="px-2 font-bold text-xl">Timer: </p>
                    <input
                      type="number"
                      max="120"
                      value={timer}
                      onChange={(e) => handleTimerChange(e)}
                      className="bg-gray rounded-md w-1/2 text-black p-1 px-2"
                    />
                  </div>
                  <div className="setting flex items-center justify-center w-full text-sm pt-1">
                    <p>Make this my default timer?</p>
                    <input
                      onChange={(e) => updateTimerPreference(e)}
                      type="checkbox"
                      className="bg-gray rounded-md mx-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              id="bottom-content"
              className="absolute bottom-0 px-4 py-2 w-full border-t border-gray flex items-center justify-between"
            >
              <Button
                text="← Back"
                link="/"
                backgroundColor="bg-white"
                clickFunction={null}
                disableLink={false}
              />
              <Button
                text={isStarting ? 'Starting...' : 'Start'}
                link=""
                disableLink={true}
                backgroundColor="bg-primary"
                clickFunction={handleStartClick}
                disabled={isStarting || !sessionName}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
