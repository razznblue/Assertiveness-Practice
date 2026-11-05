import Image from 'next/image'

const AnonymousHomeView = () => (
  <>
    <p className="m-2 p-3 text-center text-4xl text-white">Sign In to start practicing!</p>
    <Image loading="eager" src="/images/logo.webp" alt="Assertiveness Practice logo" height={500} width={500} />
  </>
)

export default AnonymousHomeView
