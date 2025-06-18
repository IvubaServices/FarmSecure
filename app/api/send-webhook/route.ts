import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const response = await fetch("https://hook.us1.make.com/4y3ncboamv6dxhgfjg10ui0v2k8x9qem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Hello from Vercel!",
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Error sending webhook: ${response.statusText}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook Error:", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}
