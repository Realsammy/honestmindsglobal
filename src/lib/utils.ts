import { customAlphabet } from 'nanoid'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Create a custom nanoid generator with only uppercase letters and numbers
const generateId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8)

export function generateReferralCode(): string {
  return generateId()
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function calculateNextContributionDate(lastDate: Date | string): Date {
  const date = new Date(lastDate)
  date.setDate(date.getDate() + 7) // Add 7 days
  return date
}

export function calculateDefaultAmount(weeklyAmount: number, defaultWeeks: number): number {
  return weeklyAmount * defaultWeeks
}

export function isEligibleForFoodstuff(
  totalReferrals: number,
  referralsWithin40Days: number,
  activeReferrals: number
): boolean {
  return totalReferrals >= 5 && referralsWithin40Days >= 3 && activeReferrals >= 2
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 