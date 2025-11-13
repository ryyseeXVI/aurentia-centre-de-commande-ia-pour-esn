/**
 * Mobile Device Detection Hook
 *
 * @fileoverview Custom React hook for detecting mobile viewport sizes
 * and responding to viewport changes. Uses window.matchMedia() for
 * efficient, CSS-based breakpoint detection.
 *
 * @module hooks/use-mobile
 */

import * as React from "react"

/**
 * Mobile viewport breakpoint in pixels
 *
 * @constant
 * @type {number}
 * @default 768
 *
 * @remarks
 * This breakpoint aligns with Tailwind CSS's default `md` breakpoint.
 * Screens narrower than 768px are considered mobile devices.
 *
 * @see {@link https://tailwindcss.com/docs/screens|Tailwind Breakpoints}
 */
const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect if the current viewport is mobile-sized
 *
 * Uses the matchMedia API to detect viewport width and automatically updates
 * when the viewport size changes (e.g., window resize, device rotation).
 * This hook is reactive and will trigger re-renders when crossing the breakpoint.
 *
 * @returns {boolean} `true` if viewport width is below 768px, `false` otherwise
 *
 * @example
 * ```typescript
 * import { useIsMobile } from '@/hooks/use-mobile'
 *
 * export default function ResponsiveComponent() {
 *   const isMobile = useIsMobile()
 *
 *   return (
 *     <div>
 *       {isMobile ? (
 *         <MobileLayout />
 *       ) : (
 *         <DesktopLayout />
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Conditional rendering based on viewport
 * function Navigation() {
 *   const isMobile = useIsMobile()
 *
 *   return isMobile ? <MobileMenu /> : <DesktopMenu />
 * }
 * ```
 *
 * @remarks
 * **Performance:**
 * - Uses matchMedia() which is more efficient than listening to resize events
 * - Only triggers updates when crossing the breakpoint threshold
 * - Properly cleans up event listeners on unmount
 *
 * **Server-Side Rendering:**
 * - Returns `false` initially (server-side default)
 * - Updates to actual viewport size on client hydration
 * - May cause a flash of desktop content on mobile during hydration
 *
 * **Hydration Considerations:**
 * Consider using CSS media queries for critical layout decisions to avoid
 * hydration mismatches and improve initial render performance.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia|matchMedia API}
 */
export function useIsMobile() {
  // Initialize with undefined to detect initial render
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Create media query list for mobile breakpoint
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    /**
     * Handles viewport size changes
     * Updates state when crossing the mobile breakpoint
     */
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Listen for breakpoint changes (resize, rotation)
    mql.addEventListener("change", onChange)

    // Set initial value immediately after mount
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // Cleanup: remove listener on unmount
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Convert undefined to false for consistent boolean return
  return !!isMobile
}
