## ⚡ **`/optimize`** — Performance Optimization

Analyze and optimize application performance across bundle size, runtime, database queries, and rendering for this Next.js 16 + React 19 + Supabase stack.

### Your Task

When optimizing performance:

1. **Bundle Size Analysis**:
   ```bash
   # Analyze bundle
   pnpm build
   # Check .next/build-manifest.json

   # Install bundle analyzer
   npm install @next/bundle-analyzer
   # Configure in next.config.ts
   ```

   **Optimizations**:
   - [ ] Code split large components with `dynamic()`
   - [ ] Lazy load React Bits components
   - [ ] Remove unused dependencies
   - [ ] Use tree-shakeable imports
   - [ ] Optimize third-party scripts

   ```typescript
   // Before: Import entire library
   import { Button, Card, Dialog, /* many more */ } from '@/components/ui'

   // After: Import only what's needed
   import { Button } from '@/components/ui/button'
   import { Card } from '@/components/ui/card'

   // Lazy load heavy components
   const HeavyChart = dynamic(() => import('@/components/charts/heavy-chart'), {
     loading: () => <Skeleton className="h-[400px]" />,
     ssr: false
   })
   ```

2. **React Performance**:

   **Find Re-renders**:
   - Use React DevTools Profiler
   - Identify unnecessary re-renders
   - Check component render times

   **Optimize with Memoization**:
   ```typescript
   // Memoize expensive computations
   const sortedTasks = useMemo(
     () => tasks.sort((a, b) => a.priority - b.priority),
     [tasks]
   )

   // Memoize callbacks
   const handleSubmit = useCallback((data: FormData) => {
     // handler logic
   }, [dependencies])

   // Memoize components
   const MemoizedTaskCard = React.memo(TaskCard, (prev, next) => {
     return prev.task.id === next.task.id && prev.task.updatedAt === next.task.updatedAt
   })
   ```

   **Split Large Contexts**:
   ```typescript
   // Before: One large context
   <AppContext> {/* contains auth, workspace, tasks, chat */}

   // After: Split into specific contexts
   <AuthContext>
     <WorkspaceContext>
       <TasksContext> {/* Only for task-related pages */}
       </TasksContext>
     </WorkspaceContext>
   </AuthContext>
   ```

3. **Database Performance**:

   **Identify N+1 Queries**:
   ```typescript
   // Before: N+1 queries
   const tasks = await supabase.from('tasks').select('*')
   for (const task of tasks) {
     const user = await supabase.from('users').select('*').eq('id', task.assigned_to)
   }

   // After: Single query with join
   const tasks = await supabase
     .from('tasks')
     .select(`
       *,
       assigned_user:auth.users!tasks_assigned_to_fkey(id, email, full_name)
     `)
   ```

   **Select Only Needed Columns**:
   ```typescript
   // Before: Select everything
   const { data } = await supabase.from('tasks').select('*')

   // After: Select specific columns
   const { data } = await supabase
     .from('tasks')
     .select('id, name, status, priority, due_date')
   ```

   **Add Missing Indexes**:
   ```sql
   -- Check slow queries in Supabase Dashboard
   -- Add indexes for frequently queried columns
   CREATE INDEX idx_tasks_status ON tasks(organization_id, status);
   CREATE INDEX idx_tasks_assigned ON tasks(assigned_to) WHERE status != 'completed';
   ```

4. **Image Optimization**:
   ```typescript
   // Always use next/image
   import Image from 'next/image'

   <Image
     src="/image.jpg"
     alt="Description"
     width={800}
     height={600}
     placeholder="blur"
     blurDataURL="data:image/..."
     loading="lazy"
   />

   // Optimize external images
   <Image
     src="https://external.com/image.jpg"
     alt="Description"
     width={800}
     height={600}
     unoptimized={false} // Let Next.js optimize
   />
   ```

5. **Loading Performance**:

   **Route-based Code Splitting** (automatic in Next.js):
   - Each page is automatically code-split
   - Use dynamic imports for heavy components

   **Lazy Load Heavy Components**:
   ```typescript
   const KanbanBoard = dynamic(() => import('@/components/kanban/board'), {
     loading: () => <BoardSkeleton />,
     ssr: false // Client-side only if needed
   })

   const MarkdownEditor = dynamic(() => import('@/components/editor'), {
     loading: () => <EditorSkeleton />
   })
   ```

   **Preload Critical Resources**:
   ```typescript
   // In layout.tsx or page.tsx
   import { preload } from 'react-dom'

   preload('/fonts/inter.woff2', { as: 'font', type: 'font/woff2' })
   ```

6. **Runtime Performance**:

   **Debounce/Throttle Expensive Operations**:
   ```typescript
   import { useDebouncedCallback } from 'use-debounce'

   const handleSearch = useDebouncedCallback((query: string) => {
     // Search logic
   }, 300)

   // Or throttle for scroll/resize
   const handleScroll = useThrottledCallback(() => {
     // Scroll logic
   }, 100)
   ```

   **Virtual Scrolling for Long Lists**:
   ```typescript
   import { useVirtualizer } from '@tanstack/react-virtual'

   const virtualizer = useVirtualizer({
     count: items.length,
     getScrollElement: () => parentRef.current,
     estimateSize: () => 50,
   })

   virtualizer.getVirtualItems().map(virtualRow => (
     <div key={virtualRow.index}>
       {items[virtualRow.index]}
     </div>
   ))
   ```

   **Optimize Animations**:
   ```css
   /* Use transform and opacity for 60fps animations */
   .animate {
     transform: translateX(0);
     transition: transform 0.3s ease;
     will-change: transform;
   }

   /* Avoid animating: width, height, top, left */
   ```

7. **Caching Strategy**:

   **Server Actions Caching**:
   ```typescript
   // Use React Cache for deduplication
   import { cache } from 'react'

   const getOrganization = cache(async (id: string) => {
     const { data } = await supabase
       .from('organizations')
       .select('*')
       .eq('id', id)
       .single()
     return data
   })
   ```

   **Stale-While-Revalidate**:
   ```typescript
   // SWR pattern with React Query or similar
   const { data } = useQuery({
     queryKey: ['tasks', workspaceId],
     queryFn: () => fetchTasks(workspaceId),
     staleTime: 1000 * 60, // 1 minute
     cacheTime: 1000 * 60 * 5, // 5 minutes
   })
   ```

8. **Lighthouse Audit**:
   ```bash
   # Run Lighthouse
   lighthouse https://your-app.com --view

   # Check scores:
   # - Performance: Target >90
   # - Accessibility: Target >95
   # - Best Practices: Target >95
   # - SEO: Target >90
   ```

   **Common Issues**:
   - Large JavaScript bundles → Code split
   - Unoptimized images → Use next/image
   - Render-blocking resources → Preload critical, defer non-critical
   - Long tasks → Break up with setTimeout or requestIdleCallback
   - Layout shifts → Reserve space for dynamic content

### Output

Provide optimization report:

```markdown
## Performance Optimization Report

### Bundle Size
- **Before**: 520KB first load JS
- **After**: 380KB first load JS (-27%)
- **Actions**: Code split React Bits, lazy load charts

### React Performance
- **Optimizations**: Memoized 5 expensive computations, split WorkspaceContext
- **Result**: 40% fewer re-renders on task updates

### Database
- **Query Optimization**: Reduced N+1 queries in task list
- **Indexes Added**: tasks(organization_id, status), tasks(assigned_to)
- **Result**: 60% faster page load

### Images
- **Converted**: 15 images to next/image with WebP
- **Result**: 45% smaller image payload

### Lighthouse Scores
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Performance | 75 | 92 | +17 |
| FCP | 2.8s | 1.4s | -50% |
| LCP | 4.2s | 2.1s | -50% |
| CLS | 0.15 | 0.02 | -87% |

### Impact
- Page load: 4.2s → 2.1s (-50%)
- Time to Interactive: 5.1s → 2.8s (-45%)
- Bundle size: 520KB → 380KB (-27%)
```

### Related Commands
- Before optimization: Use `/check` to verify baseline
- After optimization: Use `/deploy` to ship improvements
- Performance issues: Run `/optimize` iteratively

### Optimization Checklist
- [ ] Bundle size <500KB first load JS
- [ ] Code splitting for heavy components
- [ ] Memoization for expensive computations
- [ ] Database queries optimized (no N+1)
- [ ] Indexes on frequently queried columns
- [ ] Images using next/image
- [ ] Virtual scrolling for long lists
- [ ] Debounce/throttle expensive operations
- [ ] Lighthouse Performance >90
- [ ] FCP <2s, LCP <2.5s, CLS <0.1
