"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

// This wrapper component ensures we only render the debugger on the client
export function AuthDebuggerWrapper() {
  return <AuthDebugger />
}

function AuthDebugger() {
  const { user, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Debugger</CardTitle>
        <CardDescription>Diagnose authentication issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Firebase Authentication Status</h3>
          <div className="bg-muted p-4 rounded-md overflow-auto max-h-40">
            <pre className="text-xs">
              {loading
                ? "Loading..."
                : JSON.stringify(
                    {
                      user: user
                        ? {
                            uid: user.uid,
                            email: user.email,
                            emailVerified: user.emailVerified,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                            metadata: user.metadata,
                          }
                        : null,
                    },
                    null,
                    2,
                  )}
            </pre>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Authentication Status</h3>
          <div className="bg-muted p-4 rounded-md">
            <p>
              <strong>Status:</strong> {loading ? "Loading..." : user ? "Authenticated" : "Not authenticated"}
            </p>
            {user && (
              <p>
                <strong>User Email:</strong> {user.email}
              </p>
            )}
          </div>
        </div>

        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>}

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mt-2">
            This page shows your current authentication status with Firebase.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
