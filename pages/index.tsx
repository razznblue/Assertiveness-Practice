/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import Button from '@/components/button/Button'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import axios from 'axios'

export default function Home() {
  const { data: session } = useSession()

  const [topicOfDay, setTopicOfDay] = useState(null)

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

  /* JSX */
  return (
    <div className="flex items-center justify-center h-screen">
      <main className="flex flex-col items-center justify-evenly h-full">
        {!session ? (
          <>
            <p className="text-white p-3 m-2 text-4xl text-center">Sign In to start practicing!</p>
            <Image src="/images/logo.webp" alt="" height="500" width="500" />
          </>
        ) : (
          <>
            <div id="top-content" className="flex flex-col items-center">
              <h1 className="text-primary text-3xl font-bold">Hello {session?.user?.name}!</h1>
              <p className="text-white p-3 m-2 text-lg w-1/2 text-center">
                "Being passive gets you nowhere. Being aggressive gets you noticed. Being assertive
                gets you respect." - Steve Maraboli
              </p>
            </div>

            <div id="bottom-content" className="flex flex-col items-center justify-evenly">
              <div id="topic-of-day" className="text-white text">
                <p className="text-xl pb-4 mb-1">Topic Of The Day: {topicOfDay}</p>
              </div>

              <div id="buttons" className="grid grid-cols-2 gap-2">
                <Button
                  text="My Profile"
                  link="/"
                  backgroundColor="bg-primary"
                  clickFunction={null}
                  disableLink={false}
                />
                <Button
                  text="My Progress"
                  link="/"
                  backgroundColor="bg-primary"
                  clickFunction={null}
                  disableLink={false}
                />
                <Button
                  text="New Session"
                  link="/session/new"
                  backgroundColor="bg-primary"
                  clickFunction={null}
                  disableLink={false}
                />
                <Button
                  text="My Settings"
                  link="/"
                  backgroundColor="bg-primary"
                  clickFunction={null}
                  disableLink={false}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
