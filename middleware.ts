import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define which paths are accessible without authentication
const publicPaths = ["/auth/login", "/auth/signup", "/auth/reset-password"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // Get the authentication cookie
  const authCookie = request.cookies.get("auth")
  const isAuthenticated = authCookie?.value === "true"

  // If the path is not public and the user is not authenticated,
  // redirect to the login page
  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // If the user is authenticated and trying to access auth pages,
  // redirect to the home page
  if (isPublicPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
}
