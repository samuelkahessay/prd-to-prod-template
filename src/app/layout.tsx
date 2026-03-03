import type { Metadata } from 'next'
import { Inter, Instrument_Serif } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-inter',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'prd-to-prod — Autonomous Software Pipeline',
  description:
    'Drop a PRD. The pipeline decomposes, implements, reviews, merges, and deploys. If CI breaks, it fixes itself.',
  openGraph: {
    title: 'prd-to-prod — Autonomous Software Pipeline',
    description:
      'Turn product requirements into deployed software. Autonomously.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body>{children}</body>
    </html>
  )
}
