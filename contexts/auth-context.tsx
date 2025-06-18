"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import Cookies from "js-cookie"

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<any>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("Setting up auth state change listener")
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? `User logged in: ${firebaseUser.email}` : "User logged out")
      setUser(firebaseUser)

      // Set or remove cookie based on auth state
      if (firebaseUser) {
        console.log("Setting auth cookie")
        Cookies.set("auth", "true", { expires: 7 })
      } else {
        console.log("Removing auth cookie")
        Cookies.remove("auth")
      }

      setLoading(false)
    })

    return () => {
      console.log("Cleaning up auth state change listener")
      unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log("Logging in user:", email)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("Login successful for:", userCredential.user.email)

      // Set auth cookie when user logs in
      console.log("Setting auth cookie after login")
      Cookies.set("auth", "true", { expires: 7 }) // Expires in 7 days

      return userCredential
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log("Signing up user:", email)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log("Signup successful for:", userCredential.user.email)

      // Set auth cookie when user signs up
      console.log("Setting auth cookie after signup")
      Cookies.set("auth", "true", { expires: 7 })

      return userCredential
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      console.log("Logging out user")
      await signOut(auth)

      // Remove auth cookie when user logs out
      console.log("Removing auth cookie after logout")
      Cookies.remove("auth")

      console.log("Logout successful")
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log("Sending password reset email to:", email)
      await sendPasswordResetEmail(auth, email)
      console.log("Password reset email sent")
    } catch (error) {
      console.error("Password reset error:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
