import ActionButtonGrid from '@/components/Home/ActionButtonGrid'

const actions = [
  { text: 'My Profile', link: '/profile?tab=My%20Information' },
  { text: 'My Progress', link: '/profile?tab=My%20Progress' },
  { text: 'New Session', link: '/session/new' },
  { text: 'My Settings', link: '/profile?tab=Settings' },
]

const AuthenticatedHomeView = ({
  sessionName,
  topicOfDay,
}: {
  sessionName: string
  topicOfDay: string | null
}) => (
  <>
    <div id="top-content" className="flex flex-col items-center">
      <h1 className="text-3xl font-bold text-primary">Hello {sessionName}!</h1>
      <p className="m-2 w-1/2 p-3 text-center text-lg text-white">
        &ldquo;Being passive gets you nowhere. Being aggressive gets you noticed. Being assertive
        gets you respect.&rdquo; - Steve Maraboli
      </p>
    </div>

    <div id="bottom-content" className="flex flex-col items-center justify-evenly">
      <div id="topic-of-day" className="text-white text">
        <p className="mb-1 pb-4 text-xl">Topic Of The Day: {topicOfDay}</p>
      </div>

      <ActionButtonGrid actions={actions} />
    </div>
  </>
)

export default AuthenticatedHomeView
