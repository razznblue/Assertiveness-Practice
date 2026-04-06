/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import Button from '@/components/button/Button'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import axios from 'axios'
import { generateRandomString, getInitials } from '@/util/functions'

export default function NewSession() {
  const { data: session } = useSession()

  /* Hooks */
  const [userId, setUserId] = useState(null)

  const [sessionName, setSessionName] = useState('')
  const [topic, setTopic] = useState('')
  const [timer, setTimer] = useState(60)

  const [timerChecked, setTimerChekced] = useState(false)

  const generateSessionName = () => {
    const randomString = generateRandomString(16)
    const initials = getInitials(session?.user?.name)
    topic !== ''
      ? setSessionName(`${initials}-${topic?.toLowerCase()}-${randomString}`)
      : setSessionName(`${initials}-${randomString}`)
  }

  const setRandomTopic = async () => {
    const res = await axios.get('/api/topic')
    setTopic(res?.data?.topic?.name)
  }

  const createNewTopic = async () => {
    if (topic && topic !== '') {
      try {
        await axios.post('/api/topics', { name: topic })
      } catch (e) {
        console.error('Server Side Error: ', e)
      }
    }
  }

  const handleTimerChange = async (e) => {
    setTimer(Number.isNaN(e?.target?.valueAsNumber) ? '' : e?.target?.valueAsNumber)
    const newTimer = Number.isNaN(e?.target?.valueAsNumber) ? '' : e?.target?.valueAsNumber
    if (timerChecked && newTimer !== '') {
      await axios.patch(`/api/users/${userId}`, { settings: { defaultTimer: newTimer } })
    }
  }

  const updateTimerPreference = async (e) => {
    setTimerChekced(e?.target?.checked)
    if (timerChecked && !Number.isNaN(timer) && userId) {
      await axios.patch(`/api/users/${userId}`, { settings: { defaultTimer: timer } })
    }
  }

  const handleStartClick = async () => {
    await createNewTopic()
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
            <Image src="/images/logo.webp" alt="" height="500" width="500" />
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
                      onChange={(e) => setTopic(e?.target?.value)}
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
                text="Start"
                link={`/session/${sessionName}`}
                backgroundColor="bg-primary"
                clickFunction={handleStartClick}
                disableLink={false}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
