const feedbackItems = [
  {
    title: 'Speaking cadence',
    text: 'Keep your pace steady and pause after key points to improve clarity and confidence.',
  },
  {
    title: 'Boundary setting',
    text: 'Use short, direct phrases when responding to pressure and stay grounded in your goals.',
  },
  {
    title: 'Confidence cues',
    text: 'Add deliberate posture and breath control to reinforce calm, confident communication.',
  },
]

const FeedbackTab = () => (
  <div className="space-y-4">
    {feedbackItems.map((item) => (
      <div
        key={item.title}
        className="rounded-2xl border border-white/10 bg-[#2d4054] p-5 text-slate-200"
      >
        <div className="text-xl font-semibold text-[#4ec7b4]">{item.title}</div>
        <p className="mt-2 text-base leading-7 text-slate-300">{item.text}</p>
      </div>
    ))}
  </div>
)

export default FeedbackTab
