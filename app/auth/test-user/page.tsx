import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestUserPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test User Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">
            <strong>Email:</strong> test@example.com
          </p>
          <p>
            <strong>Password:</strong> password123
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Use these credentials to test the login functionality. Make sure to create this user in your Firebase
            Authentication console.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
