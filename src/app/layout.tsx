import type { Metadata, Viewport } from "next"
import { Montserrat, Poppins } from "next/font/google"
import { ThemeProvider } from "next-themes"

import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

/** Brand typography: Montserrat carries the interface, Poppins is reserved
 *  for figures so numbers read as a distinct voice from labels. */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
})

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://occuply-pms.vercel.app"),
  title: {
    default: "Occuply — Property Management System",
    template: "%s · Occuply",
  },
  description:
    "Occuply is an all-in-one property management system: calendar, rooms, rates, channel distribution, maintenance and dynamic pricing in one place. Manage Better. Grow Faster.",
  applicationName: "Occuply",
  keywords: [
    "property management system",
    "PMS",
    "channel manager",
    "dynamic pricing",
    "hotel software",
    "villa management",
  ],
  openGraph: {
    title: "Occuply — Property Management System",
    description: "Manage Better. Grow Faster. Smarter property management.",
    url: "https://occuply-pms.vercel.app",
    siteName: "Occuply",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Occuply — Property Management System",
    description: "Manage Better. Grow Faster.",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F3" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
