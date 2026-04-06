/* eslint-disable react/self-closing-comp */
/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import styles from '@/styles/Audio.module.css'
import Button from '@/components/button/Button'
import Image from 'next/image'

const mimeType = 'audio/webm'

type RecordingStatus = 'inactive' | 'recording' | 'stopped'
type SessionAction = 'save' | 'restart' | 'home'

interface AudioRecorderProps {
  topic?: string
  topicImage?: string
  sessionName?: string
  onSave?: (audioBlob: Blob) => void
  onRestart?: () => void
  onHome?: () => void
}

const AudioRecorder = ({
  topic = 'Notebook',
  topicImage = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
  sessionName = 'JanSession-1',
  onSave, // saves the AudioBlob to storage and the record to the database
  onRestart, // closes the current session and start a new session
  onHome, // closes the current session and go to the home page
}: AudioRecorderProps) => {
  const [permission, setPermission] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('inactive')
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [audio, setAudio] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [pulseActive, setPulseActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (recordingStatus === 'recording') {
      setPulseActive(true)
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000)
    } else {
      setPulseActive(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [recordingStatus])

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const getMicrophonePermission = async () => {
    if ('MediaRecorder' in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        setPermission(true)
        setStream(streamData)
      } catch (err: any) {
        alert(err.message)
      }
    } else {
      alert('MediaRecorder API is not supported in your browser.')
    }
  }

  const startRecording = async () => {
    if (!permission) await getMicrophonePermission()
    setRecordingStatus('recording')
    setRecordingTime(0)
    setAudio(null)
    setAudioBlob(null)

    const media = new MediaRecorder(stream!, { mimeType })
    mediaRecorder.current = media
    mediaRecorder.current.start()

    const localChunks: Blob[] = []
    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data?.size > 0) localChunks.push(e.data)
    }
    setAudioChunks(localChunks)
  }

  const stopRecording = () => {
    setRecordingStatus('stopped')
    mediaRecorder.current?.stop()
    mediaRecorder.current!.onstop = () => {
      const blob = new Blob(audioChunks, { type: mimeType })
      const url = URL.createObjectURL(blob)
      setAudio(url)
      setAudioBlob(blob)
      setAudioChunks([])
      setShowModal(true)
    }
  }

  const handleAction = (action: SessionAction) => {
    setShowModal(false)
    if (action === 'save') {
      if (audioBlob && onSave) onSave(audioBlob)
    } else if (action === 'restart') {
      setAudio(null)
      setAudioBlob(null)
      setRecordingTime(0)
      setRecordingStatus('inactive')
      if (onRestart) onRestart()
    } else {
      if (onHome) onHome()
    }
  }

  return (
    <>
      <div className={styles['ar-root']}>
        {/* Main */}
        <main className={styles['ar-main']}>
          {/* Topic header */}
          <div className={styles['ar-topic-header']}>
            <svg
              className={styles['ar-topic-icon']}
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <h1 className={styles['ar-topic-name']}>{topic}</h1>
            <span className={styles['ar-session-badge']}>{sessionName}</span>
          </div>

          {/* Image */}
          <div className={styles['ar-image-wrapper']}>
            <Image src={topicImage} alt={topic} width="800" height="400" />
            <div
              className={clsx(
                styles['ar-image-overlay'],
                recordingStatus === 'recording' && styles.visible
              )}
            >
              <div className={styles['ar-recording-indicator']}>
                <div className={styles['ar-rec-dot']} />
                <span className={styles['ar-rec-label']}>Recording</span>
                <span className={styles['ar-rec-time']}>{formatTime(recordingTime)}</span>
              </div>
            </div>
          </div>

          {/* Audio playback */}
          {audio && recordingStatus === 'stopped' && (
            <div className={styles['ar-audio-bar']}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#38bda4"
                strokeWidth="2"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <audio ref={audioRef} src={audio} controls />
            </div>
          )}

          {/* Bottom bar */}
          <div className={styles['ar-bottom']}>
            <Button
              text="Back"
              link="/session/new"
              backgroundColor="bg-primary"
              clickFunction={null}
              disableLink={false}
              cssOvveride={clsx(styles['ar-btn'], styles['ar-btn-ghost'])}
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              }
            />

            {/* Center action */}
            {!permission && recordingStatus === 'inactive' && (
              <Button
                text="Enable Mic"
                link="/"
                clickFunction={getMicrophonePermission}
                disableLink={true}
                cssOvveride={clsx(styles['ar-btn'], styles['ar-btn-record'])}
                icon={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                  </svg>
                }
              />
            )}
            {permission && recordingStatus === 'inactive' && (
              <button
                className={clsx(styles['ar-btn'], styles['ar-btn-record'])}
                onClick={startRecording}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                </svg>
                Start Recording
              </button>
            )}
            {recordingStatus === 'recording' && (
              <button
                className={clsx(styles['ar-btn'], styles['ar-btn-stop'])}
                onClick={stopRecording}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                Stop Recording
              </button>
            )}
            {recordingStatus === 'stopped' && (
              <button
                className={clsx(styles['ar-btn'], styles['ar-btn-record'])}
                onClick={() => setShowModal(true)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Review Session
              </button>
            )}

            <button className={clsx(styles['ar-btn'], styles['ar-btn-danger'])}>End Session</button>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className={styles['ar-modal-backdrop']}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className={styles['ar-modal']}>
            <div className={styles['ar-modal-icon']}>
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#38bda4"
                strokeWidth="2"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={styles['ar-modal-title']}>Session Complete</div>
            <div className={styles['ar-modal-sub']}>
              Great work on <strong style={{ color: '#e8e4dc' }}>{topic}</strong>. What would you
              like to do with this recording?
            </div>
            {recordingTime > 0 && (
              <div className={styles['ar-modal-duration']}>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                {formatTime(recordingTime)} recorded
              </div>
            )}
            <div className={styles['ar-modal-actions']}>
              <button
                className={clsx(styles['ar-modal-btn'], styles['ar-modal-btn-primary'])}
                onClick={() => handleAction('save')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <path d="M17 21v-8H7v8M7 3v5h8" />
                </svg>
                Save Session
              </button>
              <div className="ar-modal-divider" />
              <button
                className={clsx(styles['ar-modal-btn'], styles['ar-modal-btn-secondary'])}
                onClick={() => handleAction('restart')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again — Same Topic
              </button>
              <button
                className={clsx(styles['ar-modal-btn'], styles['ar-modal-btn-danger'])}
                onClick={() => handleAction('home')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <path d="M9 22V12h6v10" />
                </svg>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AudioRecorder
