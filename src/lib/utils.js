import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// @ts-ignore
export const BASE_URL = import.meta.env.BASE_URL;

/** @param {...ClassValue} inputs */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** @param {string} pathname */
export function resolveUrlPath(pathname) {
  const base = typeof BASE_URL === 'string' ? BASE_URL : '/';
  const normalizedBase = base.endsWith('/') ? base : base + '/';
  const normalizedPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  return normalizedBase.startsWith('/') ? normalizedBase + normalizedPath : '/' + normalizedBase + normalizedPath;
}

/** @import {ClassValue} from 'clsx' */
