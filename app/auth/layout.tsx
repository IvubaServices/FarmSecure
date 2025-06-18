import type React from "react"
import Image from "next/image"
import { ModeToggle } from "@/components/mode-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4" style={{ perspective: "1000px" }}>
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="mb-8 flex flex-col items-center justify-center">
        <Image
          src="/NewIvubaBird.png"
          alt="Ivuba Command Shield Kingfisher Logo"
          width={120}
          height={120}
          className="rounded-lg"
        />
        <Image
          src="/NewIvubaWriting.png"
          alt="Ivuba Command Shield Text"
          width={150} // Smaller width
          height={50} // Smaller height, maintaining aspect ratio
          className="mt-2" // Add some margin-top for spacing
        />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
