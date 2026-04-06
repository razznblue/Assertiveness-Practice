import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import dbConnect from '@/db/dbConnect'
import { userIsAdmin } from '@/helpers/APIHelper'
import { UserModel } from '@/db/models'

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
        const email = credentials?.user?.email
        const username = credentials?.user?.name
        const provider = credentials?.account?.provider?.toUpperCase()
        const providerId = credentials?.account?.providerAccountId

        await dbConnect()
        const existingUser = await UserModel.findOne({
          username,
          'provider.providerId': providerId,
        })

        if (!existingUser) {
          console.info(`${username} does not have an account. Creating now.`)
          const newUser = new UserModel({
            username,
            email,
            provider: { name: provider, providerId },
            settings: { defaultTimer: 60, autofillSessionName: false },
          })
          const saved = await newUser.save()
          console.log('New user saved:', saved._id)
        } else {
          console.log(`Welcome back ${username}!`)
        }

        return true
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
