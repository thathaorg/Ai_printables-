import type React from "react"
import type { Metadata } from "next"
import { Fredoka, Nunito } from "next/font/google"
import "../styles/globals.css"
import { AuthProvider } from "./AuthProvider"
import ClientLayout from "@/components/ClientLayout"
import Footer from "@/components/Footer"
import { ToastProviderWrapper } from "@/components/ui/use-toast"
import { generateMetadata as generateSEOMetadata, generateOrganizationSchema, generateWebApplicationSchema } from "@/lib/seo"

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  weight: ["400", "500", "600", "700"],
})

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = generateSEOMetadata({
  title: "Kiwiz – AI Printables for Toddlers",
  description:
    "Make print-ready coloring pages and tracing worksheets in seconds. Pick a template, tweak a few options, print. Safe for ages 2–5.",
  keywords: [
    "AI coloring pages",
    "tracing worksheets",
    "printable worksheets toddlers",
    "alphabet tracing",
    "preschool printables",
    "kids coloring pages free",
    "AI printables",
  ],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationSchema = generateOrganizationSchema()
  const webAppSchema = generateWebApplicationSchema()

  return (
    <AuthProvider>
      <html lang="en" className={`${fredoka.variable} ${nunito.variable} antialiased`}>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
          />
        </head>
        <body className="overflow-x-hidden font-sans">
          <ToastProviderWrapper>
            <ClientLayout>{children}</ClientLayout>
          </ToastProviderWrapper>
          <div className="hidden lg:block">
            <Footer />
          </div>
        </body>
      </html>
    </AuthProvider>
  )
}
