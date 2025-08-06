import { IconPlaceholder } from "@tabler/icons-react"
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

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
          IconPlaceholder:'nik@gmail.com'
        },
        password:{label:'Password',type:'password'}
      },
      async authorize(credentials: { email: string; password: string } | undefined)
      {
        const user = {id:'1',name:'nikunj',email:'nik@gmail.com'}
        return user
      }
    }),
  ],
}
const handler = NextAuth(authOptions)
export {handler as GET, handler as POST}