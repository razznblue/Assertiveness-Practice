import { useState } from 'react'
import axios from 'axios'

const FeedbackTab = () => {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitFeedback = async () => {
    if (!message.trim()) return

    setIsSubmitting(true)

    try {
      await axios.post('https://formspree.io/f/maeekkar', {
        message,
      })

      setMessage('')
      alert('Thanks for your feedback!')
    } catch {
      alert('Could not send feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#2d4054] p-5 text-slate-200">
      <div className="mb-3 text-xl font-semibold text-[#4ec7b4]">Send feedback</div>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={6}
        placeholder="Tell us what you think..."
        className="w-full rounded-xl border border-white/10 bg-[#1f2f3d] px-3 py-3 text-white placeholder:text-slate-400 focus:border-[#4ec7b4] focus:outline-none"
      />
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={submitFeedback}
          disabled={isSubmitting || !message.trim()}
          className="rounded-xl bg-[#4ec7b4] px-5 py-2.5 font-semibold text-[#0A192F] transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Sending...' : 'Send feedback'}
        </button>
      </div>
    </div>
  )
}

export default FeedbackTab
