// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth(
  // `withAuth` gives you access to req.nextauth.token
  function middleware(req) {
    // you could add extra logic here if needed
  },
  {
    pages: {
      signIn: "/signup", // redirect to signup if not logged in
    },
  }
);

export const config = {
  matcher: [
    "/home/:path*",       // protect /home and all subroutes
    "/editorPage/:path*", // protect /editorPage
    "/pricing/:path*"
  ],
};
