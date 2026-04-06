/* eslint-disable react/no-unescaped-entities */
import styles from '@/styles/Home.module.css'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import Image from 'next/image'

export default function Home() {
  const { data: session } = useSession()

  const [topic, setTopic] = useState(null)
  const [image, setImage] = useState('')
  const [time, setTime] = useState(60)
  const [customTime, setCustomTime] = useState(null)
  const [timerExpired, setTimerExpired] = useState(false)

  const setRandomTopic = async () => {
    const res = await axios.get('/api/topics/random')
    setTopic(res?.data?.topic?.name)
    setImage(res?.data?.topic?.image)
  }

  const handleCustomTimeChange = (e: any) => {
    setCustomTime(e.target.value)
  }

  /* Timer Logic */
  useEffect(() => {
    /* Set new Topic when time expires */
    if (timerExpired) {
      setRandomTopic()
      setTimerExpired(false)
      setTime(customTime || 60)
    }

    /* Set time to 60 or use the users custom time */
    setTime(customTime || 60)
    const intervalId = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime <= 1) {
          setTimerExpired(true)
          return 60
        } else {
          return prevTime - 1
        }
      })
    }, 1000)

    /* Clean up Interval when component unmounts */
    return () => {
      clearInterval(intervalId)
    }
  }, [topic, customTime, timerExpired])

  /* Set the initial topic once */
  useEffect(() => {
    setRandomTopic()
  }, [])

  /* Press ENTER to change topic */
  useEffect(() => {
    async function handleKeyPress(event: any) {
      if (event.key === 'Enter') {
        setRandomTopic()
      }
    }
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  if (!session) {
    return (
      <div className={styles.container}>
        <h1 className="text-white mb-5 text-2xl">
          Practice your speaking skills to become more confident and assertive in life!
        </h1>
        <Image width="500" height="500" src="/images/logo.webp" alt="assertive-logo" />
        {/* <p className="text-white mb-5">Click Sign In to get started!</p> */}
      </div>
    )
  }

  /* JSX */
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.options}>
          <p>Hit 'Enter' to skip the current topic</p>
          <p>When the timer runs out, a new topic will be chosen for you automagically!</p>
          <p>Enter a Custom Time below if you want additional or less time.</p>
          <p className={styles.timer}>Timer: {time} seconds</p>
          <p className={styles['custom-time']}>
            Custom Time:{' '}
            <input
              type="number"
              value={customTime || ''}
              onChange={handleCustomTimeChange}
              min="1"
              max="1000"
              step="1"
            />
          </p>
        </div>

        <p style={{ fontSize: 'max(5.5vw, 130px)' }}>{topic}</p>
        <Image width={100} height={100} alt="" src={image} unoptimized />
      </main>

      {/* Optional FOOTER */}
      {/* <footer className={styles.footer}>
        <a
          href="https://www.udemy.com/course/say-no-to-people-pleasing-become-the-assertive-and-authentic-you/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Assertiveness Training Course →{` `}
        </a>
      </footer> */}
    </div>
  )
}
