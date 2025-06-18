import type React from "react"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { RealtimeProvider } from "@/contexts/realtime-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { AuthProvider } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar" // Corrected: Named import
import { Sidebar } from "@/components/sidebar" // Corrected: Named import
import { createClient } from "@/lib/supabase/server"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Farm Secure",
  description: "Advanced security and monitoring for modern farming.",
    generator: 'v0.dev'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const { data: fireZones } = await supabase.from("fire_zones").select("*").order("reported_at", { ascending: false })
  const { data: securityPoints } = await supabase
    .from("security_points")
    .select("*")
    .order("created_at", { ascending: false })
  const { data: teamMembers } = await supabase.from("team_members").select("*").order("name", { ascending: true })

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <RealtimeProvider
              initialFireZones={fireZones ?? []}
              initialSecurityPoints={securityPoints ?? []}
              initialTeamMembers={teamMembers ?? []}
            >
              <NotificationProvider>
                <main className="flex flex-col min-h-screen">
                  <Navbar />
                  <div className="flex flex-1">
                    <Sidebar />
                    <div className="flex-1 p-4 md:p-6 lg:p-8">{children}</div>
                  </div>
                </main>
                <Toaster />
              </NotificationProvider>
            </RealtimeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
