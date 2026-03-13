import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import dbConnect from '@/db/dbConnect'
import axios from 'axios'
import { userIsAdmin } from '@/helpers/APIHelper'

/* Google Login Logic */
export const authOptions = {
  providers: [
    GoogleProvider({
      // profile(profile: GoogleProfile) {
      //   return {
      //     ...profile,
      //     id: profile?.sub?.toString(),
      //     image: profile?.picture,
      //     role: profile?.role ?? "user"
      //   }
      // },
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user?.role
      const isAdmin = await userIsAdmin(token?.name, token?.email)
      token.role = isAdmin === 'true' ? 'admin' : 'user'
      return token
    },
    /* Needed to use in client components */
    async session({ session, token }) {
      if (session?.user) session.user.role = token?.role
      const isAdmin = await userIsAdmin(session?.user?.name, session?.user?.email)
      session.user.role = isAdmin === 'true' ? 'admin' : 'user'
      return session
    },

    /* This code is called after a user chooses a gmail to log in with */
    async signIn(credentials: any) {
      try {
        // Set Up User Info
        const user = credentials?.user
        const startupEmail = credentials?.user?.email
        const username = credentials?.user?.name
        const provider = credentials?.account?.provider?.toUpperCase()
        const providerId = credentials?.account?.providerAccountId

        const apiBaseUrl = process.env.NEXTAUTH_URL
        console.log('baseUrl', apiBaseUrl)

        console.log('well')
        await dbConnect()
        console.log('poo')
        console.log(`${apiBaseUrl}/api/users?username=${username}&providerId=${providerId}`)
        const res = await axios.get(
          `${apiBaseUrl}/api/users?username=${username}&providerId=${providerId}`
        )
        console.log('um')
        const potentialUser = res?.data
        console.log('res', res)
        console.log('data ', res?.data)
        console.log('good2')

        if (!potentialUser) {
          console.info(
            `${username} does not have an account. Creating one now and logging them in!!`
          )

          const appBaseUrl = process.env.APP_URL
          const newUser = await axios.post(`${appBaseUrl}/api/users`, {
            username: user?.name,
            email: startupEmail,
            provider: {
              name: provider,
              providerId: providerId,
            },
            settings: {
              defaultTimer: 60,
              autofillSessionName: false,
            },
          })
          console.log('created new user, saweeeet')
          return newUser.data
        }
        console.log(`Welcome back ${username}! Logging you in`)
        return potentialUser
      } catch (err) {
        console.error(err)
        console.error(`err logging in user ${credentials?.user?.name}.`)
        return false
      }
    },
  },
}

const authHandler = NextAuth(authOptions)
export default async function handler(...params) {
  await authHandler(...params)
}
