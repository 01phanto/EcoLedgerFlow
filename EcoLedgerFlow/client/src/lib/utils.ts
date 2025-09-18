import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTransactionHash(): string {
  const chars = '0123456789ABCDEF';
  let hash = '0x';
  for (let i = 0; i < 6; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  hash += '...';
  for (let i = 0; i < 6; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function calculateCredits(mangroveCount: number): number {
  return Math.floor(mangroveCount / 100);
}
