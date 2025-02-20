import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>XStreamer-Music Streaming</title>
        <meta name="description" content="Stream music from Spotify and SoundCloud" />
      </head>

      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
