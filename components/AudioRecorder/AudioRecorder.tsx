import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

import Button from '@/components/Button/Button'
import Modal from '@/components/Modal'
import { BackArrowIcon, CheckIcon, ClockIcon, HomeIcon, MicIcon, ResetIcon, SaveIcon } from '@/components/Icons'
import {
  AudioPlayback,
  RecorderArtwork,
  RecorderHeader,
  ReviewSessionButton,
  StartRecordingButton,
  StopRecordingButton,
} from './RecorderParts'
import styles from '@/styles/Audio.module.css'
import type { AudioRecorderProps, SessionAction, RecordingStatus } from '@/types'

const mimeType = 'audio/webm'

const AudioRecorder = ({
  topic = 'Notebook',
  topicImage = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
  sessionName = 'JanSession-1',
  timerSeconds = 60,
  allowOvertime = false,
  replaceTopicOnTimeout = false,
  backLink = '/session/new',
  onSave,
  onRestart,
  onHome,
  onTimeout,
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timeoutTriggeredRef = useRef(false)

  const stopRecording = useCallback((autoStop = false) => {
    if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') {
      setRecordingStatus('stopped')
      return
    }

    setRecordingStatus('stopped')
    mediaRecorder.current.stop()
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: mimeType })
      const url = URL.createObjectURL(blob)
      setAudio(url)
      setAudioBlob(blob)
      setAudioChunks([])
      audioChunksRef.current = []

      if (autoStop && replaceTopicOnTimeout && onTimeout) {
        onTimeout()
        return
      }

      setShowModal(true)
    }
  }, [onTimeout, replaceTopicOnTimeout])

  useEffect(() => {
    if (recordingStatus !== 'recording') {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      setRecordingTime((currentTime) => {
        const nextTime = currentTime + 1

        if (timerSeconds > 0 && !allowOvertime && nextTime >= timerSeconds && !timeoutTriggeredRef.current) {
          timeoutTriggeredRef.current = true
          window.setTimeout(() => {
            if (mediaRecorder.current?.state === 'recording') {
              stopRecording(true)
            }
          }, 0)
        }

        return nextTime
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [allowOvertime, recordingStatus, stopRecording, timerSeconds])

  useEffect(() => {
    audioChunksRef.current = audioChunks
  }, [audioChunks])

  useEffect(() => {
    return () => {
      if (audio && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(audio)
      }
    }
  }, [audio])

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const getMicrophonePermission = async () => {
    if ('MediaRecorder' in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        setPermission(true)
        setStream(streamData)
      } catch (error) {
        if (error instanceof Error) {
          alert(error.message)
          return
        }
        alert('Unable to access microphone permission.')
      }
      return
    }

    alert('MediaRecorder API is not supported in your browser.')
  }

  const startRecording = async () => {
    if (!permission && !stream) await getMicrophonePermission()
    if (!stream) return

    timeoutTriggeredRef.current = false
    const localChunks: Blob[] = []
    audioChunksRef.current = localChunks
    setAudioChunks(localChunks)
    setRecordingStatus('recording')
    setRecordingTime(0)
    setAudio(null)
    setAudioBlob(null)

    const media = new MediaRecorder(stream, { mimeType })
    mediaRecorder.current = media
    mediaRecorder.current.ondataavailable = (event) => {
      if (event.data?.size > 0) {
        localChunks.push(event.data)
        audioChunksRef.current = [...localChunks]
        setAudioChunks([...localChunks])
      }
    }
    mediaRecorder.current.start()
  }

  const handleAction = (action: SessionAction) => {
    setShowModal(false)
    if (audio && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(audio)
    }

    if (action === 'save') {
      if (audioBlob && onSave) onSave(audioBlob)
    } else if (action === 'restart') {
      setAudio(null)
      setAudioBlob(null)
      setRecordingTime(0)
      setRecordingStatus('inactive')
      if (onRestart) onRestart()
    } else if (onHome) {
      onHome()
    }
  }

  return (
    <>
      <div className={styles['ar-root']}>
        <main className={styles['ar-main']}>
          <RecorderHeader topic={topic} sessionName={sessionName} />

          <RecorderArtwork
            topic={topic}
            topicImage={topicImage}
            recordingStatus={recordingStatus}
            recordingTime={recordingTime}
            timerSeconds={timerSeconds}
            allowOvertime={allowOvertime}
            formatTime={formatTime}
          />

          {audio && recordingStatus === 'stopped' && <AudioPlayback audio={audio} audioRef={audioRef} />}

          <div className={styles['ar-bottom']}>
            <Button
              text="Back"
              link={backLink}
              backgroundColor="bg-primary"
              clickFunction={null}
              disableLink={false}
              cssOvveride={clsx(styles['ar-btn'], styles['ar-btn-ghost'])}
              icon={<BackArrowIcon size={16} />}
            />

            {!permission && recordingStatus === 'inactive' && (
              <Button
                text="Enable Mic"
                link="/"
                clickFunction={getMicrophonePermission}
                disableLink={true}
                cssOvveride={clsx(styles['ar-btn'], styles['ar-btn-record'])}
                icon={<MicIcon size={18} />}
              />
            )}
            {permission && recordingStatus === 'inactive' && (
              <StartRecordingButton onClick={startRecording} />
            )}
            {recordingStatus === 'recording' && (
              <StopRecordingButton onClick={stopRecording} />
            )}
            {recordingStatus === 'stopped' && (
              <ReviewSessionButton onClick={() => setShowModal(true)} />
            )}

            <button
              type="button"
              className={clsx(styles['ar-btn'], styles['ar-btn-danger'])}
              onClick={() => handleAction('home')}
            >
              End Session
            </button>
          </div>
        </main>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Session Complete"
        description={
          <>
            Great work on <strong style={{ color: '#e8e4dc' }}>{topic}</strong>. What would you like
            to do with this recording?
          </>
        }
        icon={<CheckIcon size={26} style={{ stroke: '#38bda4' }} />}
      >
        {recordingTime > 0 && (
          <div className={styles['ar-modal-duration']}>
            <ClockIcon size={13} />
            {formatTime(recordingTime)} recorded
          </div>
        )}
        <div className={styles['ar-modal-actions']}>
          <button
            type="button"
            className={clsx(styles['ar-modal-btn'], styles['ar-modal-btn-primary'])}
            onClick={() => handleAction('save')}
          >
            <SaveIcon size={16} />
            Save Session
          </button>
          <div className="ar-modal-divider" />
          <button
            type="button"
            className={clsx(styles['ar-modal-btn'], styles['ar-modal-btn-secondary'])}
            onClick={() => handleAction('restart')}
          >
            <ResetIcon size={16} />
            Try Again — Same Topic
          </button>
          <button
            type="button"
            className={clsx(styles['ar-modal-btn'], styles['ar-modal-btn-danger'])}
            onClick={() => handleAction('home')}
          >
            <HomeIcon size={16} />
            Back to Home
          </button>
        </div>
      </Modal>
    </>
  )
}

export default AudioRecorder
