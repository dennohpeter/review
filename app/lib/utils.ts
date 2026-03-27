import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind-safe className merge utility
 * Prevents duplicate or conflicting Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

/**
 * Generates a unique id
 * Better than Math.random alone
 */
export function generateId() {
  return crypto.randomUUID().slice(0, 8);
}

/**
 * Formats dates consistently
 */
export function formatDate(date: Date | string | number) {
  const d = new Date(date);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(d);
}
