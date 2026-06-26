import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// The cn() helper every shadcn / Aceternity / Magic UI / React Bits component expects.
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
