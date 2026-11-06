import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import axios from 'axios'
import { signOut, useSession } from 'next-auth/react'

import Modal from '@/components/Modal'
import { ChevronIcon } from '@/components/Icons'
import MyInformationTab from '@/components/Profile/Tabs/MyInformationTab'
import MyProgressTab from '@/components/Profile/Tabs/MyProgressTab'
import FeedbackTab from '@/components/Profile/Tabs/FeedbackTab'
import SettingsTab from '@/components/Profile/Tabs/SettingsTab'
import PlaceholderTab from '@/components/Profile/Tabs/PlaceholderTab'
import type { HistoryItem, HistoryRecording, HistorySession, ProfileTab } from '@/types'

const tabs = ['My Progress', 'My Information', 'Achievements', 'Settings', 'Feedback', 'Logout'] as const

const ProfileSidebar = ({
  activeTab,
  onChange,
  onLogoutClick,
}: {
  activeTab: ProfileTab
  onChange: (tab: ProfileTab) => void
  onLogoutClick: () => void
}) => (
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
                  onLogoutClick()
                  return
                }
                onChange(tab)
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
)

const ProfileHeader = ({ title }: { title: string }) => (
  <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
    <h1 className="text-[3.1rem] font-bold leading-none text-[#4ec7b4]">{title}</h1>
    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#4ec7b4]">
      <ChevronIcon size={24} />
    </div>
  </div>
)

const ProfilePage = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const initialTab =
    typeof router.query.tab === 'string' &&
    ['My Progress', 'My Information', 'Achievements', 'Settings', 'Feedback', 'Logout'].includes(router.query.tab)
      ? (router.query.tab as ProfileTab)
      : 'My Progress'

  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  useEffect(() => {
    if (router.isReady && typeof router.query.tab === 'string') {
      const nextTab = router.query.tab as ProfileTab
      if (['My Progress', 'My Information', 'Achievements', 'Settings', 'Feedback', 'Logout'].includes(nextTab)) {
        setActiveTab(nextTab)
      }
    }
  }, [router.isReady, router.query.tab])

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

        const mergedHistory = sessions.map((item: HistorySession) => {
          const matchingRecording = recordings.find((recording: HistoryRecording) => {
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

  const handleLogout = async () => {
    setShowLogoutModal(false)
    await signOut({ callbackUrl: '/' })
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'My Progress':
        return (
          <MyProgressTab
            loading={loading}
            history={history}
            deletingId={deletingId}
            audioRefs={audioRefs}
            onDelete={handleDeleteRecording}
            onPlay={playRecording}
            formatDate={formatDate}
          />
        )
      case 'My Information':
        return <MyInformationTab name={session?.user?.name} email={session?.user?.email} />
      case 'Feedback':
        return <FeedbackTab />
      case 'Achievements':
        return <PlaceholderTab title="Achievements" />
      case 'Settings':
        return <SettingsTab />
      default:
        return <PlaceholderTab title="Profile" />
    }
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

  const sectionTitle =
    activeTab === 'My Progress' ? 'My History' : activeTab === 'My Information' ? 'My Information' : activeTab

  return (
    <>
      <div className="min-h-screen bg-[#0A192F] px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-8">
            <ProfileSidebar
              activeTab={activeTab}
              onChange={setActiveTab}
              onLogoutClick={() => setShowLogoutModal(true)}
            />

            <section className="flex-1 rounded-[28px] bg-[#243847] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
              <ProfileHeader title={sectionTitle} />
              {renderTabContent()}
            </section>
          </div>
        </div>
      </div>

      <Modal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Log out"
        description="Are you sure you want to log out of your account?"
        primaryButtonText="Log out"
        secondaryButtonText="Cancel"
        onPrimaryClick={handleLogout}
        onSecondaryClick={() => setShowLogoutModal(false)}
      />
    </>
  )
}

export default ProfilePage
