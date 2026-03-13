import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EconGrapher — AI Economics Assistant',
  description: 'AI economics assistant for AP Micro & Macroeconomics. Ask questions, explore concepts, and generate interactive graphs through natural language.',

  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },

  // Open Graph / Facebook / Teams / LinkedIn
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://econgrapher.pages.dev',
    siteName: 'EconGrapher',
    title: 'EconGrapher — AI Economics Assistant',
    description: 'AI economics assistant for AP Micro & Macroeconomics. Ask questions, explore concepts, and generate interactive graphs through natural language.',
    images: [
      {
        url: 'https://econgrapher.pages.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EconGrapher - AI-Powered Economics Chart Generator',
      },
    ],
  },

  // Twitter / X
  twitter: {
    card: 'summary_large_image',
    title: 'EconGrapher — AI Economics Assistant',
    description: 'AI economics assistant for AP Micro & Macroeconomics. Ask questions, explore concepts, and generate interactive graphs through natural language.',
    images: ['https://econgrapher.pages.dev/og-image.png'],
    creator: '@ItsTimeTooSleep',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
