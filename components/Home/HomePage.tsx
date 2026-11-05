import { useEffect, useState } from 'react'
import axios from 'axios'
import { useSession } from 'next-auth/react'

import AnonymousHomeView from '@/components/Home/AnonymousHomeView'
import AuthenticatedHomeView from '@/components/Home/AuthenticatedHomeView'

const HomePage = () => {
  const { data: session } = useSession()
  const [topicOfDay, setTopicOfDay] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchTopic = async () => {
      const res = await axios.get('/api/topics/random')
      if (!cancelled) setTopicOfDay(res?.data?.topic?.name)
    }

    fetchTopic()

    return () => {
      cancelled = true
    }
  }, [])

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
