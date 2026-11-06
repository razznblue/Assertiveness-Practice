import type * as React from 'react'
import type { ComponentPropsWithoutRef, ChangeEvent, ReactNode, RefObject } from 'react'

export interface HistoryItem {
  _id: string
  name: string
  createdAt: string
  recordingUrl?: string
  topicName?: string
  timer?: number
  recording?: {
    _id?: string
    recordingUrl?: string
  }
}

export interface HistorySession {
  _id: string
  name: string
  createdAt: string
  userId?: string
  topicName?: string
  timer?: number
  recordingUrl?: string
}

export interface HistoryRecording {
  _id?: string
  sessionId?: string
  userId?: string
  recordingUrl?: string
}

export type ProfileTab = 'My Progress' | 'My Information' | 'Achievements' | 'Settings' | 'Feedback' | 'Practice Tips' | 'Logout'

export interface SessionFieldProps {
  label: string
  children: ReactNode
  helperText?: string
  onHelperClick?: () => void
}

export interface SessionInputProps {
  value: string | number
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  type?: 'text' | 'number'
  max?: number
  className?: string
  disabled?: boolean
}

export interface ActionItem {
  text: string
  link: string
  backgroundColor?: string
}

export interface TopicConflictError {
  response?: {
    status?: number
    data?: {
      topic?: {
        _id?: string | null
      }
    }
  }
}

export interface MyInformationTabProps {
  name?: string | null
  email?: string | null
}

export interface UserSettings {
  defaultTimer?: number
  autofillSessionName?: boolean
  replaceTopicOnTimeout?: boolean
  allowOvertime?: boolean
}

export interface PlaceholderTabProps {
  title: string
}

export interface MyProgressTabProps {
  loading: boolean
  history: HistoryItem[]
  deletingId: string | null
  audioRefs: RefObject<Record<string, HTMLAudioElement | null>>
  onDelete: (item: HistoryItem) => void
  onPlay: (itemId: string) => void
  formatDate: (value?: string) => string
}

export type RecordingStatus = 'inactive' | 'recording' | 'stopped'

export interface AudioRecorderProps {
  topic?: string
  topicImage?: string
  sessionName?: string
  timerSeconds?: number
  allowOvertime?: boolean
  replaceTopicOnTimeout?: boolean
  backLink?: string
  onSave?: (audioBlob: Blob) => void
  onRestart?: () => void
  onHome?: () => void
  onTimeout?: () => void
}

export type SessionAction = 'save' | 'restart' | 'home'

export interface ButtonProps {
  text: string
  link: string
  backgroundColor?: string
  clickFunction?: (() => void | Promise<void>) | null
  disableLink: boolean
  cssOvveride?: string
  icon?: ReactNode
  disabled?: boolean
}

export interface ModalProps {
  open: boolean
  onClose?: () => void
  title?: string
  description?: ReactNode
  icon?: ReactNode
  children?: ReactNode
  primaryButtonText?: string
  secondaryButtonText?: string
  onPrimaryClick?: () => void
  onSecondaryClick?: () => void
  primaryButtonClassName?: string
  secondaryButtonClassName?: string
}

export type IconProps = ComponentPropsWithoutRef<'svg'> & {
  size?: number
}

export interface RecorderHeaderProps {
  topic: string
  sessionName: string
}

export interface RecorderArtworkProps {
  topic: string
  topicImage: string
  recordingStatus: RecordingStatus
  recordingTime: number
  timerSeconds: number
  allowOvertime?: boolean
  formatTime: (value: number) => string
}

export interface AudioPlaybackProps {
  audio: string
  audioRef: RefObject<HTMLAudioElement | null>
}

export interface RecorderActionButtonProps {
  children: ReactNode
  className: string
  onClick?: () => void
}
