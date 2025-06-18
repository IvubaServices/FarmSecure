"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Cookies from "js-cookie"

export function AuthDebug() {
  const { user, loading } = useAuth()
  const [cookieValue, setCookieValue] = useState<string | undefined>("")

  useEffect(() => {
    // Check for auth cookie
    const authCookie = Cookies.get("auth")
    setCookieValue(authCookie)
  }, [user])

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p>
            <strong>Loading:</strong> {loading ? "Yes" : "No"}
          </p>
          <p>
            <strong>User Authenticated:</strong> {user ? "Yes" : "No"}
          </p>
          {user && (
            <>
              <p>
                <strong>User Email:</strong> {user.email}
              </p>
              <p>
                <strong>User ID:</strong> {user.uid}
              </p>
            </>
          )}
          <p>
            <strong>Auth Cookie:</strong> {cookieValue ? cookieValue : "Not set"}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              // Manually set auth cookie for testing
              Cookies.set("auth", "true", { expires: 7 })
              setCookieValue(Cookies.get("auth"))
            }}
            variant="outline"
          >
            Set Test Cookie
          </Button>
          <Button
            onClick={() => {
              // Remove auth cookie
              Cookies.remove("auth")
              setCookieValue(Cookies.get("auth"))
            }}
            variant="outline"
          >
            Remove Cookie
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
