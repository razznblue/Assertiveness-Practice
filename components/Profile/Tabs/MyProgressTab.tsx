import { PlayIcon, TrashIcon } from '@/components/Icons'
import Button from '@/components/Button/Button'
import type { MyProgressTabProps } from '@/types'

const MyProgressTab = ({
  loading,
  history,
  deletingId,
  audioRefs,
  onDelete,
  onPlay,
  formatDate,
}: MyProgressTabProps) => {
  if (loading) {
    return <div className="text-slate-300">Loading session history...</div>
  }

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#2d4054] p-8 text-slate-300">
        No saved sessions yet. Start a recording to build your history.
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {history.map((item) => (
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
                <Button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#4ec7b4] text-white transition hover:scale-[1.02]"
                  aria-label="Play recording"
                  onClick={() => onPlay(item._id)}
                >
                  <PlayIcon size={20} />
                </Button>
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

              <Button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#e85d5d] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Delete recording"
                disabled={deletingId === (item.recording?._id || item._id)}
                onClick={() => onDelete(item)}
              >
                {deletingId === (item.recording?._id || item._id) ? '…' : <TrashIcon size={20} />}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default MyProgressTab
