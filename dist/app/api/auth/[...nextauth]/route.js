import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export const authOptions = {
    session: {
        strategy: 'jwt'
    },
    providers: [
        CredentialsProvider({
            name: 'Sign in',
            credentials: {
                email: {
                    label: 'Email',
                    type: 'email',
                    placeholder: 'nik@gmail.com'
                },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!(credentials === null || credentials === void 0 ? void 0 : credentials.email) || !credentials.password) {
                    return null;
                }
                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email,
                    }
                });
                if (!user) {
                    return null;
                }
                const isPasswordValid = await compare(credentials.password, user.password);
                if (!isPasswordValid) {
                    return null;
                }
                return {
                    id: user.id + '',
                    email: user.email,
                    name: user.name
                };
            }
        }),
    ],
    pages: {
        signIn: '/signin',
    },
    callbacks: {
        session: ({ session, token }) => {
            console.log('Session Callback', { session, token });
            return session;
        },
        jwt: ({ token, user }) => {
            console.log('JWT Callback', { token, user });
            if (user) {
                const u = user;
                return Object.assign(Object.assign({}, token), { id: u.id });
            }
            return token;
        },
        async redirect({ url, baseUrl }) {
            console.log("Redirected url", { url, baseUrl });
            if (url.startsWith("/"))
                return `${baseUrl}${url}`;
            //same-origin absolute url, allow it
            if (new URL(url).origin === baseUrl)
                return url;
            //fallback- always send to homepage
            return baseUrl;
        }
    }
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
