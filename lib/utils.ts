/**
 * Utility functions module
 *
 * @fileoverview This file contains common utility functions used throughout
 * the application, including className manipulation helpers and other shared utilities.
 *
 * @module lib/utils
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple className values and intelligently merges Tailwind CSS classes
 *
 * This utility function combines clsx for conditional className handling with
 * tailwind-merge to properly merge Tailwind CSS classes, preventing conflicts
 * when multiple classes modify the same CSS properties.
 *
 * @param inputs - Variable number of className values (strings, objects, arrays)
 * @returns A single merged className string with Tailwind conflicts resolved
 *
 * @example
 * ```typescript
 * // Simple concatenation
 * cn("text-red-500", "bg-blue-100") // "text-red-500 bg-blue-100"
 *
 * // With conflicts - last one wins
 * cn("text-red-500", "text-blue-500") // "text-blue-500"
 *
 * // With conditional classes
 * cn("base-class", isActive && "active-class") // "base-class active-class" or "base-class"
 *
 * // With objects
 * cn("base", { "active": isActive, "disabled": isDisabled })
 * ```
 *
 * @see {@link https://github.com/lukeed/clsx|clsx documentation}
 * @see {@link https://github.com/dcastil/tailwind-merge|tailwind-merge documentation}
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
