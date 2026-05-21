import { JetBrains_Mono, Manrope } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
const manrope = Manrope({
    variable: "--font-manrope",
    subsets: ["latin"],
});
const jetbrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
    subsets: ["latin"],
});
export const metadata = {
    title: "CoSync | Real-Time Collaboration That Feels Instant",
    description: "Premium real-time code collaboration with shared rooms, voice presence, and resilient multiplayer editing.",
};
export default function RootLayout({ children, }) {
    return (<html lang="en">
      <body className={`${manrope.variable} ${jetbrainsMono.variable}`}>
        {children}
        <Toaster position="top-right" toastOptions={{
            style: {
                background: "rgba(12, 18, 28, 0.94)",
                color: "#f7f3ea",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35)",
            },
        }}/>
      </body>
    </html>);
}
