## ✨ **`/component-enhance`** — Enhance UI Component

Refine and elevate an existing UI component with better UX, accessibility, performance, and design system alignment. Component-focused improvements, not feature-level changes.

### Your Task

When the user requests component enhancement:

1. **Analyze Current Component**:
   - Read the component code thoroughly
   - Identify missing UX patterns (loading, error, empty states)
   - Check interaction states (hover, focus, active, disabled)
   - Evaluate accessibility (ARIA, keyboard nav, screen reader support)
   - Assess TypeScript quality (any 'any' types, missing generics)
   - Review design system alignment (variants, spacing, colors)
   - Check performance (unnecessary re-renders, heavy computations)

2. **Identify Enhancement Opportunities**:

   **Visual Refinement**:
   - Inconsistent spacing or sizing
   - Missing or weak hover/focus states
   - Abrupt transitions (needs smooth animations)
   - Dark mode issues (poor contrast, missing dark: variants)
   - Typography hierarchy needs improvement
   - Visual feedback missing (loading spinners, success indicators)

   **Interaction Polish**:
   - Missing interaction states (hover, active, focus, disabled)
   - No loading state for async operations
   - Error states not visually distinct
   - Keyboard shortcuts not implemented
   - Touch targets too small (<44x44px)
   - No optimistic UI updates

   **Accessibility Gaps**:
   - Missing ARIA labels, roles, or descriptions
   - Poor focus indicators or focus management
   - No keyboard navigation support
   - Color contrast issues (below 4.5:1 for text)
   - Missing alt text or screen reader announcements
   - No support for prefers-reduced-motion

   **TypeScript Improvements**:
   - Using 'any' instead of proper types
   - Missing generics for reusable components
   - Props interface incomplete or unclear
   - No JSDoc comments for complex props
   - Ref forwarding missing

   **Component API**:
   - Props could be more intuitive or composable
   - Missing common variants (sizes, colors, states)
   - Not using CVA (class-variance-authority) for variants
   - No support for asChild pattern (Radix)
   - Missing controlled/uncontrolled modes (for form components)

   **Performance**:
   - Unnecessary re-renders (missing memo, useMemo, useCallback)
   - Heavy computations not memoized
   - Large component not code-split
   - Animations not optimized (causing jank)
   - Event handlers recreated on every render

3. **Implement Enhancements**:

   **Maintain Compatibility**:
   - Don't break existing usage
   - Keep default behavior the same
   - Add new props with sensible defaults
   - Deprecate gracefully (keep old props working, add new ones)

   **Visual Polish**:
   ```typescript
   // Add smooth transitions
   className="... transition-all duration-200"

   // Enhance focus indicators
   className="... focus-visible:ring-[3px] focus-visible:ring-ring/50"

   // Improve hover states
   className="... hover:bg-accent/80 hover:scale-[1.02]"

   // Add dark mode support
   className="... dark:bg-input/30 dark:border-input"
   ```

   **Interaction States**:
   ```typescript
   // Add loading state
   interface ComponentProps {
     loading?: boolean
   }

   {loading && <Spinner className="size-4" />}

   // Add disabled state styling
   className="... disabled:opacity-50 disabled:pointer-events-none"

   // Add error state
   className={cn(
     "...",
     error && "border-destructive ring-destructive/20"
   )}
   ```

   **Accessibility**:
   ```typescript
   // Add ARIA attributes
   <button
     aria-label="Close dialog"
     aria-pressed={isActive}
     aria-disabled={disabled}
     role="button"
   >

   // Keyboard navigation
   onKeyDown={(e) => {
     if (e.key === 'Enter' || e.key === ' ') {
       e.preventDefault()
       onClick?.(e)
     }
   }}

   // Focus management
   const ref = useRef<HTMLDivElement>(null)
   useEffect(() => {
     if (autoFocus) ref.current?.focus()
   }, [autoFocus])
   ```

   **TypeScript**:
   ```typescript
   // Replace 'any' with proper types
   - items: any[]
   + items: Array<{ id: string; label: string }>

   // Add generics for reusability
   interface ComponentProps<T> {
     items: T[]
     renderItem: (item: T) => React.ReactNode
   }

   // Add JSDoc for complex props
   /**
    * Callback fired when item is selected
    * @param item - The selected item
    * @param index - Index of the selected item
    */
   onSelect?: (item: T, index: number) => void
   ```

   **Use CVA for Variants**:
   ```typescript
   import { cva, type VariantProps } from "class-variance-authority"

   const componentVariants = cva("base-classes", {
     variants: {
       variant: {
         default: "...",
         secondary: "...",
         destructive: "...",
       },
       size: {
         sm: "...",
         default: "...",
         lg: "...",
       }
     },
     defaultVariants: {
       variant: "default",
       size: "default",
     }
   })
   ```

   **Performance**:
   ```typescript
   // Memoize expensive computations
   const sortedItems = useMemo(
     () => items.sort((a, b) => a.order - b.order),
     [items]
   )

   // Memoize component if props don't change often
   export const Component = React.memo(ComponentImpl)

   // Memoize callbacks
   const handleClick = useCallback(() => {
     // handler logic
   }, [dependencies])
   ```

4. **Specific Enhancement Categories**:

   **Form Components** (inputs, select, checkbox):
   - Add validation state styling
   - Integrate with react-hook-form
   - Show error messages properly
   - Add required indicator
   - Improve focus states

   **Interactive Components** (buttons, links, cards):
   - Add micro-interactions (subtle scale, shadow changes)
   - Improve touch targets for mobile
   - Add ripple effect or similar feedback
   - Ensure proper disabled state

   **Data Display** (tables, lists, cards):
   - Add loading skeletons
   - Add empty states with helpful messaging
   - Improve responsive behavior
   - Add virtualization for long lists

   **Overlay Components** (modals, tooltips, popovers):
   - Add smooth enter/exit animations
   - Improve positioning logic
   - Add focus trapping for modals
   - Ensure ESC key closes
   - Add backdrop blur or overlay

5. **Test Enhancements**:
   - [ ] Verify all interaction states work
   - [ ] Test keyboard navigation thoroughly
   - [ ] Check with screen reader (or verify ARIA attributes)
   - [ ] Test color contrast with dev tools
   - [ ] Verify mobile responsiveness
   - [ ] Check dark mode appearance
   - [ ] Test with prefers-reduced-motion enabled
   - [ ] Verify TypeScript compiles with no errors
   - [ ] Check that existing usage still works

### Output

After enhancement, provide:

1. **Enhancement Summary**:
   - What was improved and why
   - Before/after comparison for key changes

2. **Visual Improvements**:
   - New interaction states added
   - Animation enhancements
   - Dark mode improvements
   - Spacing/sizing adjustments

3. **Accessibility Enhancements**:
   - ARIA attributes added
   - Keyboard shortcuts implemented
   - Focus management improvements
   - Screen reader considerations

4. **TypeScript Improvements**:
   - Type safety enhancements
   - Generics added
   - JSDoc comments added
   - Removed 'any' types

5. **Component API Changes**:
   - New props added (with defaults)
   - New variants or sizes
   - Breaking changes (if any - avoid these!)
   - Migration guide (if needed)

6. **Performance Optimizations**:
   - Memoization added
   - Re-render optimizations
   - Code splitting (if applicable)
   - Animation performance

7. **Testing Checklist**:
   - [ ] Visual regression test (compare before/after)
   - [ ] Interaction states (hover, focus, active, disabled, loading)
   - [ ] Keyboard navigation works
   - [ ] Screen reader compatible
   - [ ] Mobile responsive
   - [ ] Dark mode correct
   - [ ] Reduced motion respected
   - [ ] No TypeScript errors
   - [ ] Existing usage unaffected

### Best Practices

- **Backward Compatibility**: Existing code should continue working
- **Progressive Enhancement**: Add features, don't remove
- **Subtle Improvements**: Polish should feel natural, not jarring
- **Design System First**: Use existing patterns and components
- **Accessibility is Mandatory**: Don't ship without proper ARIA/keyboard support
- **Performance Matters**: Don't add features that cause jank
- **TypeScript Strict**: No 'any', proper types always
- **Test Thoroughly**: Enhancement should improve, not break

### Difference from `/enhance`

- **`/component-enhance`**: Focused on single UI component improvements (visual, interaction, accessibility)
- **`/enhance`**: Broader feature enhancements (functionality, capabilities, architecture)

Use `/component-enhance` for making a component production-ready with excellent UX.
Use `/enhance` for adding new capabilities to a feature.
