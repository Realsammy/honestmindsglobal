'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { User } from '../types'
import { createVirtualAccount as createFWVirtualAccount } from '../lib/flutterwave'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  profile: any | null
  signIn: (identifier: string, password: string) => Promise<void>
  signUp: (email: string, password: string, extra?: { fullName: string; phone: string; gender: string }) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  updateUser: (data: Partial<User>) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  signIn: async () => {},
  signUp: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  updateUser: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any | null>(null)
  const router = useRouter()
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    setLoading(true)

    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Supabase session on mount:', session);

        if (mounted.current) {
          setSession(session)
          setUser(session?.user ?? null)
          console.log('Set user:', session?.user);
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        if (mounted.current) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return

      setLoading(true)
      setSession(session)
      setUser(session?.user ?? null)
      console.log('Auth state changed:', event, session);

      setLoading(false)
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (identifier: string, password: string) => {
    // Check if identifier is email or phone
    const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier);
    let emailToUse = identifier;
    if (!isEmail) {
      // Lookup user by phone
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('phone', identifier)
        .single();
      if (error || !data?.email) {
        throw new Error('No user found with this phone number');
      }
      emailToUse = data.email;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });
    if (error) throw error;
  }

  const signUp = async (email: string, password: string, extra?: { fullName: string; phone: string; gender: string }) => {
    const { error, data } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // Save extra fields to profile table
    if (extra && data.user) {
      const { fullName, phone } = extra;
      const now = new Date().toISOString();
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          phone,
          created_at: now,
          updated_at: now,
        });
      if (profileError) throw profileError;

      // Automatically create a Flutterwave virtual account (no BVN required)
      try {
        const va = await createFWVirtualAccount(email, fullName, phone, data.user.id);
        // Store in virtual_accounts table
        await supabase.from('virtual_accounts').upsert({
          user_id: data.user.id,
          account_number: va.accountNumber,
          bank_name: va.bankName,
          tx_ref: va.orderRef,
          flw_ref: va.flwRef,
          order_ref: va.orderRef,
          is_active: true,
          created_at: now,
        });
      } catch (vaError) {
        console.error('Failed to create virtual account for new user:', vaError);
        // Do not block signup if VA creation fails
      }
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/update-password` : undefined
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const updateUser = async (data: Partial<User>) => {
    const { error } = await supabase.auth.updateUser(data)
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, signIn, signUp, resetPassword, updatePassword, updateUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
