import { IconPlaceholder } from "@tabler/icons-react"
import { compare } from "bcryptjs"
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import {prisma} from '@/lib/prisma'
//const prisma = new PrismaClient()
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

export const authOptions: NextAuthOptions = {
  session:{
    strategy:'jwt'
  }, 
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret:GOOGLE_CLIENT_SECRET
    }),
    CredentialsProvider({
      name: 'Sign in',
      credentials:{
        email:{
          label:'Email',
          type:'email',
          placeholder:'nik@gmail.com'
        },
        password:{label:'Password',type:'password'}
      },
      async authorize(credentials)
      {
         if(!credentials?.email || !credentials.password){
          return null
         }

         const user = await prisma.user.findUnique({
          where:{
            email: credentials.email,
          }
         })
         if(!user){
          return null
         }

         const isPasswordValid = await compare(credentials.password,user.password)
         if(!isPasswordValid){
          return null
         }

         return{
          id: user.id + '',
          email: user.email,
          name: user.name
         }
      }
    }),
  ],
  pages:{
    signIn:'/signin',
  },
  callbacks:{
    session: ({session,token}) => {
      //@ts-ignore
      session.user.id = token.id as string;
      return session
    },
    jwt:({token,user}) => {
      console.log('JWT Callback',{token,user})
      if(user){
        return {
          ...token,
          id: (user as any).id
        }
      }
      return token
    },
    async redirect({url,baseUrl}){
      if(url.startsWith("/")) return `${baseUrl}${url}`;
      //same-origin absolute url, allow it
      if(new URL(url).origin === baseUrl) return url;

      //fallback- always send to homepage
      return baseUrl;
    }
  }
}
const handler = NextAuth(authOptions)
export {handler as GET, handler as POST}