## 🎨 **`/component`** — Create UI Component

Build a new UI component with exceptional UX that respects the app's design system, accessibility standards, and best practices.

### Your Task

When the user requests a new UI component:

1. **Discovery & Analysis**:
   - Understand the component requirements and use case
   - Check if similar component exists in shadcn/ui library
   - Check if advanced variant exists in React Bits library (`components/react-bits/`)
   - Ask clarifying questions if requirements are unclear:
     * Component category (primitive, composite, form, feedback, etc.)
     * Required variants and sizes
     * Interaction states needed
     * Form integration requirements
     * Special UX considerations

2. **Design System Alignment**:
   - Use existing shadcn/ui components as primitives when possible
   - Reference React Bits library for advanced patterns (22 categories available)
   - Match existing spacing, colors, typography from Tailwind config
   - Follow established patterns from `components/ui/button.tsx` and similar
   - Use `class-variance-authority` (CVA) for variant management
   - Ensure dark mode support with `dark:` prefix

3. **Component Architecture**:
   - **File naming**: Use `kebab-case.tsx` (e.g., `status-badge.tsx`)
   - **TypeScript**: Strict types, no `any`, use VariantProps from CVA
   - **Props API**: Clear, composable, support ref forwarding
   - **Composition**: Support `asChild` pattern (Radix) when appropriate
   - **Exports**: Named exports for tree-shaking

4. **UX Excellence Checklist**:

   **Visual Polish**:
   - [ ] Consistent spacing using Tailwind scale
   - [ ] Proper visual hierarchy with typography
   - [ ] Smooth transitions (duration-200, duration-300)
   - [ ] Dark mode support with proper contrast
   - [ ] SVG icon sizing and spacing handled automatically

   **Interaction States**:
   - [ ] Hover state (`hover:` variants)
   - [ ] Active state (`active:` variants)
   - [ ] Focus state (`focus-visible:ring-[3px]` with proper color)
   - [ ] Disabled state (`disabled:pointer-events-none disabled:opacity-50`)
   - [ ] Loading state (spinner, skeleton, or progress indicator)
   - [ ] Error state (`aria-invalid` with visual feedback)

   **Accessibility (WCAG 2.1 AA)**:
   - [ ] Semantic HTML elements
   - [ ] ARIA labels, roles, and attributes
   - [ ] Keyboard navigation (Tab, Enter, Escape, Arrow keys)
   - [ ] Focus management and focus trapping (for modals/dialogs)
   - [ ] Screen reader announcements for dynamic content
   - [ ] Color contrast ratios (4.5:1 for text, 3:1 for UI)
   - [ ] Support for `prefers-reduced-motion`

   **Responsive Design**:
   - [ ] Mobile-first approach
   - [ ] Touch targets minimum 44x44px (use `h-10 w-10` or larger)
   - [ ] Responsive spacing and sizing with Tailwind breakpoints
   - [ ] Test on mobile, tablet, desktop viewports

   **Form Integration** (if applicable):
   - [ ] Support `name` and `value` props
   - [ ] Controlled and uncontrolled modes
   - [ ] Validation state handling
   - [ ] Integration with react-hook-form
   - [ ] Proper error message association

   **Edge Cases**:
   - [ ] Empty states with helpful messaging
   - [ ] Error states with recovery actions
   - [ ] Loading states with skeleton or spinner
   - [ ] Overflow handling (text truncation, scrolling)
   - [ ] Long content graceful degradation

5. **Implementation Pattern**:

   ```typescript
   import * as React from "react"
   import { cva, type VariantProps } from "class-variance-authority"
   import { cn } from "@/lib/utils"

   // Define variants with CVA
   const componentVariants = cva(
     "base-classes-here transition-all focus-visible:ring-[3px]",
     {
       variants: {
         variant: {
           default: "bg-primary text-primary-foreground",
           secondary: "bg-secondary text-secondary-foreground",
           // ... more variants
         },
         size: {
           default: "h-9 px-4",
           sm: "h-8 px-3",
           lg: "h-10 px-6",
         },
       },
       defaultVariants: {
         variant: "default",
         size: "default",
       },
     }
   )

   // TypeScript interface
   interface ComponentProps
     extends React.ComponentPropsWithoutRef<"div">,
       VariantProps<typeof componentVariants> {
     // Custom props
   }

   // Component implementation
   const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
     ({ className, variant, size, ...props }, ref) => {
       return (
         <div
           ref={ref}
           className={cn(componentVariants({ variant, size, className }))}
           {...props}
         />
       )
     }
   )
   Component.displayName = "Component"

   export { Component, componentVariants }
   ```

6. **Advanced Patterns** (use when appropriate):
   - **Compound components**: For complex components with sub-components
   - **Render props**: For flexible rendering control
   - **Animation**: Use React Bits effects or Tailwind animations
   - **Portals**: For modals, tooltips, popovers (use Radix primitives)
   - **Virtualization**: For large lists (consider react-window)
   - **Optimistic updates**: For better perceived performance

7. **Testing & Quality**:
   - Verify all interaction states work
   - Test keyboard navigation thoroughly
   - Check color contrast with dev tools
   - Test with screen reader (if possible, at minimum add proper ARIA)
   - Verify mobile responsiveness
   - Check reduced motion preference
   - Ensure TypeScript compiles with no errors

### Output

After creating the component, provide:

1. **Component Summary**:
   - What was created and its purpose
   - Where it fits in the design system

2. **Component API**:
   - Props interface with descriptions
   - Available variants and sizes
   - Ref forwarding support

3. **Usage Examples**:
   ```tsx
   // Basic usage
   <Component />

   // With variants
   <Component variant="secondary" size="lg" />

   // With custom props
   <Component disabled loading />
   ```

4. **Files Created/Modified**:
   - List all file paths
   - Note any dependencies added

5. **Accessibility Features**:
   - ARIA attributes used
   - Keyboard shortcuts supported
   - Screen reader considerations

6. **Integration Notes**:
   - How to use with forms (if applicable)
   - Context dependencies (if any)
   - Composition patterns

7. **Design System Alignment**:
   - Which shadcn/ui components were used
   - React Bits components referenced (if any)
   - Tailwind classes and patterns followed

8. **Testing Checklist**:
   - [ ] Visual states (hover, focus, active, disabled)
   - [ ] Keyboard navigation works
   - [ ] Mobile responsive
   - [ ] Dark mode looks correct
   - [ ] Screen reader compatible
   - [ ] TypeScript types correct

### Best Practices

- **Composition over Complexity**: Build from smaller primitives
- **Progressive Enhancement**: Works without JS where possible
- **Graceful Degradation**: Handles missing data elegantly
- **Performance**: Lazy load heavy components, optimize re-renders
- **Consistency**: Match existing component patterns exactly
- **Documentation**: Add JSDoc comments for props
- **Avoid**: Deep nesting, tight coupling, prop drilling, layout shifts
