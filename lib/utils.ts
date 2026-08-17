/**
 * Utilidad: combina classNames condicionalmente
 * Usado por shadcn-style components
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
