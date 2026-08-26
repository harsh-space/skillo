import type { Metadata } from 'next'
import './globals.css'
import OrbitBackground from '../components/OrbitBackground'

export const metadata: Metadata = {
  title: 'Skillo AI — Personalized Career Learning Accelerator',
  description: 'AI-driven learning path recommendations with explainable AI and adaptive feedback loops.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-[#090d16] text-slate-100 min-h-screen relative overflow-x-hidden">
        <div className="fixed inset-0 glow-gradient pointer-events-none z-0" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
