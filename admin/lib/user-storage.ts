// lib/user-storage.ts
// Add this to your main task app to store user data

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { User } from 'firebase/auth'

interface UserData {
  email: string
  displayName?: string
  photoURL?: string
  emailVerified: boolean
  createdAt?: any
  lastLoginAt?: any
}

export const saveUserData = async (user: User) => {
  try {
    const userRef = doc(db, 'users', user.uid)
    
    // Check if user already exists
    const userDoc = await getDoc(userRef)
    
    const userData: UserData = {
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      emailVerified: user.emailVerified,
      lastLoginAt: serverTimestamp()
    }

    if (!userDoc.exists()) {
      // New user - add createdAt timestamp
      userData.createdAt = serverTimestamp()
    }

    await setDoc(userRef, userData, { merge: true })
    console.log('User data saved successfully')
  } catch (error) {
    console.error('Error saving user data:', error)
  }
}

// Modified task creation function to include user info
export const createTaskWithUserInfo = async (user: User, taskData: any) => {
  try {
    // Save user data first
    await saveUserData(user)
    
    // Create task with user info
    const taskWithUserInfo = {
      ...taskData,
      userId: user.uid,
      userEmail: user.email,
      userDisplayName: user.displayName,
      createdAt: serverTimestamp()
    }

    // Your existing task creation code here
    // await addDoc(collection(db, 'tasks'), taskWithUserInfo)
    
    return taskWithUserInfo
  } catch (error) {
    console.error('Error creating task with user info:', error)
    throw error
  }
}

// Usage in your auth context or sign-in component:
/*
import { saveUserData } from '@/lib/user-storage'

// In your sign-in success handler:
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await saveUserData(user)
    // ... rest of your auth logic
  }
})

// Or in your task creation:
const handleCreateTask = async (taskData) => {
  if (user) {
    await createTaskWithUserInfo(user, taskData)
  }
}
*/