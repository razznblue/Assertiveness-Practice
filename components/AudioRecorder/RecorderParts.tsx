import type { ReactNode, RefObject } from 'react'
import clsx from 'clsx'
import Image from 'next/image'

import {
  AudioWaveIcon,
  CheckIcon,
  MicIcon,
  StopIcon,
  TopicIcon,
} from '@/components/Icons'
import type {
  AudioPlaybackProps,
  RecorderActionButtonProps,
  RecorderArtworkProps,
  RecorderHeaderProps
} from '@/types'
import styles from '@/styles/Audio.module.css'

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
  recordingStatus,
  recordingTime,
  formatTime,
}: RecorderArtworkProps) => (
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
        <span className={styles['ar-rec-time']}>{formatTime(recordingTime)}</span>
      </div>
    </div>
  </div>
)

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
  <button type="button" className={className} onClick={onClick}>
    {children}
  </button>
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
