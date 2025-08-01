"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth, db } from './firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        const adminEmails = [
          process.env.NEXT_PUBLIC_ADMIN_EMAIL,
          'admin@taskmanager.com',
          'admin@example.com',
        ]

        const userIsAdmin = adminEmails.includes(user.email as string)
        setIsAdmin(userIsAdmin)

        if (!userIsAdmin) {
          await firebaseSignOut(auth)
          setUser(null)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)

      const adminEmails = [
        process.env.NEXT_PUBLIC_ADMIN_EMAIL,
        'admin@taskmanager.com',
        'admin@example.com',
      ]

      if (!adminEmails.includes(result.user.email || '')) {
        await firebaseSignOut(auth)
        throw new Error('Unauthorized: Admin access required')
      }

      // Don't return anything — to match Promise<void>
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth)
  }

  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email)
  }

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    signIn,
    signOut,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
