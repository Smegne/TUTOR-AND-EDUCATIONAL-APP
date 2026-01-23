// app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "./providers"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ጥናት ቤት - Smart Learning Platform for Primary Students",
  description:
    "A private, safe educational platform helping Grade 5-8 students develop consistent study habits through guided tutor support and parental monitoring.",
  generator: "Smegn Destew",
  manifest: "/manifest.json",
  themeColor: "#0A2540",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ጥናት ቤት",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

// Create the HydrationFix component inline
function HydrationFix() {
  // This is a client component but we're keeping it simple
  if (typeof window !== "undefined") {
    // This will only run on the client
    document.body.removeAttribute("cz-shortcut-listen")
  }
  return null
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <Analytics />
        {/* Add HydrationFix here */}
        <HydrationFix />
      </body>
    </html>
  )
}