import axios from 'axios'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
)

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M8 5v14l11-7L8 5z" />
  </svg>
)

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
    <path d="M7 10l5 5 5-5" />
  </svg>
)

const tabs = [
  'My Information',
  'Achievements',
  'Progress',
  'Settings',
  'Feedback',
  'Logout',
] as const

interface HistoryItem {
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

export default function ProfilePage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Progress')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  useEffect(() => {
    if (!session?.user?.name) return

    const fetchHistory = async () => {
      setLoading(true)
      try {
        const res = await axios.get('/api/sessions', {
          params: { username: session.user.name },
        })

        const sessions = res?.data?.sessions ?? []
        const recordings = res?.data?.recordings ?? []

        const mergedHistory = sessions.map((item: any) => {
          const matchingRecording = recordings.find((recording: any) => {
            const itemSessionId = String(item?._id ?? '')
            const recordingSessionId = String(recording?.sessionId ?? '')
            const recordingUserId = String(recording?.userId ?? '')
            const itemUserId = String(item?.userId ?? '')

            return (
              (recordingSessionId && recordingSessionId === itemSessionId) ||
              (recordingUserId && itemUserId && recordingUserId === itemUserId && !recordingSessionId)
            )
          })

          const finalUrl = matchingRecording?.recordingUrl || item.recordingUrl || ''

          return {
            _id: item._id,
            name: item.name,
            createdAt: item.createdAt,
            recordingUrl: finalUrl,
            recording: matchingRecording,
            topicName: item.topicName || item.name,
            timer: Number(item.timer) > 0 ? Number(item.timer) : 60,
          }
        })

        setHistory(mergedHistory)
      } catch (error) {
        console.error('Failed to load profile history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [session?.user?.name])

  const formatDate = (value?: string) => {
    if (!value) return 'No date'
    const dt = new Date(value)
    if (Number.isNaN(dt.getTime())) return value
    return dt.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleDeleteRecording = async (item: HistoryItem) => {
    if (!item.recording?._id && !item._id) return

    setDeletingId(item.recording?._id || item._id)

    try {
      await axios.delete('/api/sessions', {
        params: {
          recordingId: item.recording?._id || item._id,
          sessionId: item._id,
        },
      })

      setHistory((prev) => prev.filter((entry) => entry._id !== item._id))
    } catch (error) {
      console.error('Failed to delete recording:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const playRecording = async (itemId: string) => {
    const audio = audioRefs.current[itemId]
    if (!audio || !audio.src) {
      console.error('No audio element or source for item', itemId)
      return
    }

    try {
      audio.load()
      await audio.play()
    } catch (error) {
      console.error('Failed to play recording for item', itemId, error)
    }
  }

  const renderTabContent = () => {
    if (activeTab === 'Progress') {
      return (
        <div className="space-y-4 p-4">
          {loading && <div className="text-slate-300">Loading session history...</div>}

          {!loading && history.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#2d4054] p-8 text-slate-300">
              No saved sessions yet. Start a recording to build your history.
            </div>
          )}

          {!loading &&
            history.map((item) => (
              <div
                key={item._id}
                className="rounded-2xl border border-white/10 bg-[#ccd5db] px-6 py-5 text-[#111827] shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-[1.9rem] font-semibold text-[#0a192f]">{item.name}</h3>
                      <div className="text-[3rem] font-bold leading-none text-[#0a192f]">
                        {(item.timer ?? 60)}s
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-700">
                      <div>
                        <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-600">
                          Topic
                        </div>
                        <div className="mt-1 text-base">{item.topicName || item.name}</div>
                      </div>
                      <div>
                        <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-600">
                          Date Completed
                        </div>
                        <div className="mt-1 text-base">{formatDate(item.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {item.recordingUrl && (
                  <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-slate-300 bg-white/30 px-4 py-3">
                    <div className="flex items-center gap-4 text-[#0a192f]">
                      <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#4ec7b4] text-white transition hover:scale-[1.02]"
                        aria-label="Play recording"
                        onClick={() => playRecording(item._id)}
                      >
                        <PlayIcon />
                      </button>
                      <audio
                        ref={(element) => {
                          audioRefs.current[item._id] = element
                        }}
                        controls
                        src={item.recordingUrl}
                        className="max-w-[320px]"
                        onError={(event) => {
                          console.error('Audio element error for item', item._id, event)
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#e85d5d] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Delete recording"
                      disabled={deletingId === (item.recording?._id || item._id)}
                      onClick={() => handleDeleteRecording(item)}
                    >
                      {deletingId === (item.recording?._id || item._id) ? '…' : <TrashIcon />}
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )
    }

    return (
      <div className="flex min-h-[400px] items-center justify-center p-10 text-slate-300">
        <div className="rounded-2xl border border-white/10 bg-[#2d4054] px-8 py-6 text-xl">
          {activeTab} is coming soon.
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A192F] px-6 text-center text-white">
        <div>
          <h1 className="text-3xl font-semibold">Sign in to view your profile</h1>
          <div className="mt-4">
            <Link href="/" className="rounded-xl bg-[#449E90] px-5 py-3 text-[#0a192f] font-semibold">
              Go home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A192F] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex gap-8">
          <aside className="w-[350px] rounded-[28px] bg-[#1b2e3f] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
            <ul className="space-y-5">
              {tabs.map((tab) => {
                const isActive = tab === activeTab
                const isLogout = tab === 'Logout'

                return (
                  <li key={tab}>
                    <button
                      type="button"
                      onClick={() => {
                        if (tab === 'Logout') {
                          signOut({ callbackUrl: '/' })
                          return
                        }
                        setActiveTab(tab)
                      }}
                      className={[
                        'w-full rounded-xl px-4 py-4 text-left text-3xl font-normal transition',
                        isActive
                          ? 'bg-[#4ec7b4] text-[#0a192f] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]'
                          : 'text-white hover:bg-white/5',
                        isLogout ? 'text-[#4ec7b4]' : '',
                      ].join(' ')}
                    >
                      {tab}
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          <section className="flex-1 rounded-[28px] bg-[#243847] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
            <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
              <h1 className="text-[3.1rem] font-bold leading-none text-[#4ec7b4]">
                {activeTab === 'Progress' ? 'My History' : activeTab}
              </h1>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#4ec7b4]">
                <ChevronIcon />
              </div>
            </div>

            {renderTabContent()}
          </section>
        </div>
      </div>
    </div>
  )
}
