import { AuthDebuggerWrapper } from "@/components/auth/auth-debugger"

export default function AuthDebugPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Authentication Debugging</h1>
      <AuthDebuggerWrapper />
    </div>
  )
}
