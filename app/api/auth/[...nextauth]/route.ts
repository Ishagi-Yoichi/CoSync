import { IconPlaceholder } from "@tabler/icons-react"
import { compare } from "bcryptjs"
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import {PrismaClient} from '@prisma/client'
const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  session:{
    strategy:'jwt'
  }, 
  providers: [
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
  callbacks:{
    session: ({session,token}) => {
      console.log('Session Callback',{session,token})
      return session
    },
    jwt:({token,user}) => {
      console.log('JWT Callback',{token,user})
      if(user){
        const u = user as unknown as any
        return {
          ...token,
          id: u.id
        }
      }
      return token
    }
  }
}
const handler = NextAuth(authOptions)
export {handler as GET, handler as POST}