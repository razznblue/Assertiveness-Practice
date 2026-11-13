import clsx from 'clsx'
import Image from 'next/image'

import {
  AudioWaveIcon,
  CheckIcon,
  MicIcon,
  StopIcon,
  TopicIcon,
} from '@/components/Icons'
import Button from '@/components/Button/Button'
import styles from '@/styles/Audio.module.css'
import type {
  AudioPlaybackProps,
  RecorderActionButtonProps,
  RecorderArtworkProps,
  RecorderHeaderProps
} from '@/types'

export const RecorderHeader = ({ topic, sessionName }: RecorderHeaderProps) => (
  <div className={styles['ar-topic-header']}>
    <TopicIcon className={styles['ar-topic-icon']} size={28} />
    <h1 className={styles['ar-topic-name']}>{topic}</h1>
    <span className={styles['ar-session-badge']}>{sessionName}</span>
  </div>
)

export const RecorderArtwork = ({
  topic,
  topicImage,
  topicImageAttribution,
  recordingStatus,
  recordingTime,
  timerSeconds,
  allowOvertime = false,
  formatTime,
}: RecorderArtworkProps) => {
  const overflowSeconds = Math.max(0, recordingTime - timerSeconds)
  const displayTime = allowOvertime && overflowSeconds > 0 ? `+${formatTime(overflowSeconds)}` : formatTime(Math.max(0, timerSeconds - recordingTime))

  return (
    <>
      <div className={styles['ar-image-wrapper']}>
        <Image loading="eager" src={topicImage} alt={topic} width={800} height={400} />
        <div
          className={clsx(
            styles['ar-image-overlay'],
            recordingStatus === 'recording' && styles.visible
          )}
        >
          <div className={styles['ar-recording-indicator']}>
            <div className={styles['ar-rec-dot']} />
            <span className={styles['ar-rec-label']}>Recording</span>
            <span className={styles['ar-rec-time']}>{displayTime}</span>
          </div>
        </div>
      </div>
      {topicImageAttribution && (
        <p className={styles['ar-image-attribution']}>
          Photo by{' '}
          <a href={topicImageAttribution.photographerUrl} target="_blank" rel="noopener noreferrer">
            {topicImageAttribution.photographerName}
          </a>
          {' '}on{' '}
          <a href={topicImageAttribution.photoUrl} target="_blank" rel="noopener noreferrer">
            Unsplash
          </a>
        </p>
      )}
    </>
  )
}

export const AudioPlayback = ({ audio, audioRef }: AudioPlaybackProps) => (
  <div className={styles['ar-audio-bar']}>
    <AudioWaveIcon size={18} />
    <audio ref={audioRef} src={audio} controls />
  </div>
)

export const RecorderActionButton = ({
  children,
  className,
  onClick,
}: RecorderActionButtonProps) => (
  <Button type="button" className={className} onClick={onClick}>
    {children}
  </Button>
)

export const ReviewSessionButton = ({ onClick }: { onClick?: () => void }) => (
  <RecorderActionButton className={clsx(styles['ar-btn'], styles['ar-btn-record'])} onClick={onClick}>
    <CheckIcon size={18} />
    Review Session
  </RecorderActionButton>
)

export const StartRecordingButton = ({ onClick }: { onClick?: () => void }) => (
  <RecorderActionButton className={clsx(styles['ar-btn'], styles['ar-btn-record'])} onClick={onClick}>
    <MicIcon size={18} />
    Start Recording
  </RecorderActionButton>
)

export const StopRecordingButton = ({ onClick }: { onClick?: () => void }) => (
  <RecorderActionButton className={clsx(styles['ar-btn'], styles['ar-btn-stop'])} onClick={onClick}>
    <StopIcon size={18} />
    Stop Recording
  </RecorderActionButton>
)
