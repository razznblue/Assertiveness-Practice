import { useEffect, useState } from 'react'
import axios from 'axios'
import { useSession } from 'next-auth/react'

import AnonymousHomeView from '@/components/Home/AnonymousHomeView'
import AuthenticatedHomeView from '@/components/Home/AuthenticatedHomeView'

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getCachedTopicForToday = () => {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem('topic-of-day')
    if (!raw) return null

    const parsed = JSON.parse(raw) as { dateKey?: string; topic?: string }
    if (!parsed.dateKey || !parsed.topic) return null

    if (parsed.dateKey !== getLocalDateKey()) {
      window.sessionStorage.removeItem('topic-of-day')
      return null
    }

    return parsed.topic
  } catch {
    return null
  }
}

const HomePage = () => {
  const { data: session, status } = useSession()
  const [topicOfDay, setTopicOfDay] = useState<string | null>(() => getCachedTopicForToday())

  useEffect(() => {
    if (topicOfDay) return

    let cancelled = false

    const fetchTopic = async () => {
      try {
        const res = await axios.get('/api/topics/daily')
        if (!cancelled) {
          const nextTopic = res?.data?.topic?.name ?? null
          setTopicOfDay(nextTopic)

          if (nextTopic) {
            window.sessionStorage.setItem(
              'topic-of-day',
              JSON.stringify({ dateKey: getLocalDateKey(), topic: nextTopic }),
            )
          }
        }
      } catch (error) {
        console.error('Failed to load topic of the day:', error)
        if (!cancelled) setTopicOfDay(null)
      }
    }

    fetchTopic()

    return () => {
      cancelled = true
    }
  }, [topicOfDay])

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <main className="flex h-full flex-col items-center justify-evenly">
          <div className="flex items-center gap-4">
            {[0, 1, 2].map((index) => (
              <span
                key={`home-loading-${index}`}
                className="h-4 w-4 rounded-full bg-[#4ec7b4] animate-pulse"
                style={{ animationDelay: `${index * 150}ms` }}
              />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <main className="flex h-full flex-col items-center justify-evenly">
        {!session ? (
          <AnonymousHomeView />
        ) : (
          <AuthenticatedHomeView sessionName={session?.user?.name ?? 'friend'} topicOfDay={topicOfDay} />
        )}
      </main>
    </div>
  )
}

export default HomePage
