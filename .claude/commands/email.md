## 📧 **`/email`** — Create Email Template & Sending Logic

Create production-ready email templates using Resend and React Email with proper styling, sending logic, rate limiting, and error handling.

### Your Task

When creating email functionality:

1. **Email Template with React Email**:

   **Install** (if not already):
   ```bash
   npm install @react-email/components
   ```

   **Create Template** (`emails/[template-name].tsx`):
   ```tsx
   import {
     Body,
     Button,
     Container,
     Head,
     Heading,
     Html,
     Link,
     Preview,
     Section,
     Text,
   } from '@react-email/components'

   interface WelcomeEmailProps {
     userName: string
     organizationName: string
     inviteUrl: string
   }

   export function WelcomeEmail({
     userName,
     organizationName,
     inviteUrl,
   }: WelcomeEmailProps) {
     return (
       <Html>
         <Head />
         <Preview>Welcome to {organizationName}!</Preview>
         <Body style={main}>
           <Container style={container}>
             <Heading style={h1}>Welcome to {organizationName}!</Heading>

             <Text style={text}>
               Hi {userName},
             </Text>

             <Text style={text}>
               You've been invited to join {organizationName}. Click the button
               below to accept the invitation and get started.
             </Text>

             <Section style={buttonContainer}>
               <Button style={button} href={inviteUrl}>
                 Accept Invitation
               </Button>
             </Section>

             <Text style={text}>
               Or copy and paste this URL into your browser:
             </Text>
             <Link href={inviteUrl} style={link}>
               {inviteUrl}
             </Link>

             <Text style={footer}>
               If you didn't expect this invitation, you can ignore this email.
             </Text>
           </Container>
         </Body>
       </Html>
     )
   }

   // Styles (inline for email compatibility)
   const main = {
     backgroundColor: '#f6f9fc',
     fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
   }

   const container = {
     backgroundColor: '#ffffff',
     margin: '0 auto',
     padding: '20px 0 48px',
     marginBottom: '64px',
     maxWidth: '600px',
   }

   const h1 = {
     color: '#333',
     fontSize: '24px',
     fontWeight: 'bold',
     margin: '40px 0',
     padding: '0',
     textAlign: 'center' as const,
   }

   const text = {
     color: '#333',
     fontSize: '16px',
     lineHeight: '26px',
     margin: '16px 8px',
   }

   const buttonContainer = {
     textAlign: 'center' as const,
     margin: '32px 0',
   }

   const button = {
     backgroundColor: '#000',
     borderRadius: '5px',
     color: '#fff',
     fontSize: '16px',
     fontWeight: 'bold',
     textDecoration: 'none',
     textAlign: 'center' as const,
     display: 'inline-block',
     padding: '12px 20px',
   }

   const link = {
     color: '#067df7',
     fontSize: '14px',
     textDecoration: 'underline',
   }

   const footer = {
     color: '#8898aa',
     fontSize: '12px',
     lineHeight: '16px',
     margin: '16px 8px',
   }

   export default WelcomeEmail
   ```

2. **Email Sending API Route** (`app/api/send-email/route.ts`):

   ```typescript
   import { NextResponse } from 'next/server'
   import { Resend } from 'resend'
   import { z } from 'zod'
   import { createServerSupabaseClient } from '@/utils/supabase/server'
   import { withUserRateLimit } from '@/utils/with-rate-limit'
   import { createResourceRateLimiter } from '@/utils/rate-limit'
   import { WelcomeEmail } from '@/emails/welcome-email'

   const resend = new Resend(process.env.RESEND_API_KEY)

   const sendEmailSchema = z.object({
     to: z.string().email(),
     type: z.enum(['welcome', 'invitation', 'reset-password']),
     data: z.object({
       userName: z.string(),
       organizationName: z.string().optional(),
       inviteUrl: z.string().url().optional(),
       resetUrl: z.string().url().optional(),
     }),
   })

   async function handlePost(request: Request) {
     try {
       const supabase = await createServerSupabaseClient()

       // Auth check
       const {
         data: { user },
         error: authError,
       } = await supabase.auth.getUser()

       if (authError || !user) {
         return NextResponse.json(
           { error: 'Not authenticated' },
           { status: 401 }
         )
       }

       // Validate input
       const body = await request.json()
       const validatedData = sendEmailSchema.parse(body)

       // Select email template
       let emailComponent
       let subject = ''

       switch (validatedData.type) {
         case 'welcome':
           emailComponent = WelcomeEmail({
             userName: validatedData.data.userName,
             organizationName: validatedData.data.organizationName || 'Our Platform',
             inviteUrl: validatedData.data.inviteUrl || '',
           })
           subject = `Welcome to ${validatedData.data.organizationName}!`
           break

         // Add more cases...
         default:
           return NextResponse.json(
             { error: 'Invalid email type' },
             { status: 400 }
           )
       }

       // Send email with Resend
       const { data, error } = await resend.emails.send({
         from: 'Your App <noreply@yourdomain.com>',
         to: validatedData.to,
         subject,
         react: emailComponent,
       })

       if (error) {
         console.error('Resend error:', error)
         return NextResponse.json(
           { error: 'Failed to send email' },
           { status: 500 }
         )
       }

       // Log activity
       await supabase.from('activity_logs').insert({
         user_id: user.id,
         action: 'EMAIL_SENT',
         description: `Sent ${validatedData.type} email to ${validatedData.to}`,
         metadata: { email_id: data?.id, type: validatedData.type },
       })

       return NextResponse.json({ success: true, id: data?.id })
     } catch (error) {
       if (error instanceof z.ZodError) {
         return NextResponse.json(
           { error: 'Validation failed', details: error.errors },
           { status: 400 }
         )
       }

       console.error('Unexpected error:', error)
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       )
     }
   }

   // Rate limit: 10 emails per minute per user
   export const POST = withUserRateLimit(
     handlePost,
     createResourceRateLimiter,
     true
   )
   ```

3. **Email Utility Function** (`utils/email.ts`):

   ```typescript
   import { Resend } from 'resend'
   import type { ReactElement } from 'react'

   const resend = new Resend(process.env.RESEND_API_KEY)

   interface SendEmailOptions {
     to: string | string[]
     subject: string
     react: ReactElement
     from?: string
   }

   export async function sendEmail({
     to,
     subject,
     react,
     from = 'Your App <noreply@yourdomain.com>',
   }: SendEmailOptions) {
     try {
       const { data, error } = await resend.emails.send({
         from,
         to,
         subject,
         react,
       })

       if (error) {
         console.error('Email send error:', error)
         throw new Error('Failed to send email')
       }

       return { success: true, id: data?.id }
     } catch (error) {
       console.error('Email service error:', error)
       throw error
     }
   }

   // Batch send (for notifications)
   export async function sendBatchEmails(
     emails: Array<{
       to: string
       subject: string
       react: ReactElement
     }>
   ) {
     const results = await Promise.allSettled(
       emails.map(email => sendEmail(email))
     )

     return {
       successful: results.filter(r => r.status === 'fulfilled').length,
       failed: results.filter(r => r.status === 'rejected').length,
       results,
     }
   }
   ```

4. **Common Email Templates**:

   **Password Reset**:
   ```tsx
   export function PasswordResetEmail({ userName, resetUrl }: Props) {
     return (
       <Html>
         <Head />
         <Preview>Reset your password</Preview>
         <Body style={main}>
           <Container style={container}>
             <Heading style={h1}>Password Reset Request</Heading>
             <Text style={text}>Hi {userName},</Text>
             <Text style={text}>
               We received a request to reset your password. Click the button below to create a new password:
             </Text>
             <Section style={buttonContainer}>
               <Button style={button} href={resetUrl}>
                 Reset Password
               </Button>
             </Section>
             <Text style={text}>
               This link will expire in 1 hour.
             </Text>
             <Text style={footer}>
               If you didn't request this, you can safely ignore this email.
             </Text>
           </Container>
         </Body>
       </Html>
     )
   }
   ```

   **Notification Email**:
   ```tsx
   export function NotificationEmail({ userName, message, actionUrl }: Props) {
     return (
       <Html>
         <Head />
         <Preview>{message}</Preview>
         <Body style={main}>
           <Container style={container}>
             <Heading style={h1}>New Notification</Heading>
             <Text style={text}>Hi {userName},</Text>
             <Text style={text}>{message}</Text>
             {actionUrl && (
               <Section style={buttonContainer}>
                 <Button style={button} href={actionUrl}>
                   View Details
                 </Button>
               </Section>
             )}
           </Container>
         </Body>
       </Html>
     )
   }
   ```

5. **Testing Emails**:

   **Development Preview**:
   ```bash
   # Preview emails in development
   npm run email:preview

   # Or use React Email CLI
   npx email dev
   ```

   **Test Send**:
   ```typescript
   // Create test route: app/api/test-email/route.ts
   export async function GET() {
     const { sendEmail } = await import('@/utils/email')
     const { WelcomeEmail } = await import('@/emails/welcome-email')

     await sendEmail({
       to: 'test@example.com',
       subject: 'Test Email',
       react: WelcomeEmail({
         userName: 'Test User',
         organizationName: 'Test Org',
         inviteUrl: 'https://example.com/invite/test',
       }),
     })

     return Response.json({ success: true })
   }
   ```

6. **Email Best Practices**:

   **Subject Lines**:
   - Clear and specific
   - 40-50 characters max
   - No spammy words (FREE, WIN, URGENT)

   **Content**:
   - Mobile-first design (60% of emails opened on mobile)
   - Clear call-to-action (one primary button)
   - Plain text fallback
   - Unsubscribe link (for marketing emails)

   **Technical**:
   - Inline CSS (for email client compatibility)
   - Max width 600px
   - Test in multiple email clients
   - Include preheader text
   - Proper alt text for images

   **Accessibility**:
   - Semantic HTML
   - Good color contrast
   - Clear link text
   - Readable font sizes (16px minimum)

7. **Error Handling**:

   ```typescript
   try {
     await sendEmail({/* ... */})
   } catch (error) {
     // Log error for monitoring
     console.error('Email send failed:', error)

     // Don't block user flow
     // Queue for retry or notify admin

     // Return success to user (email is async)
     return { success: true, queued: true }
   }
   ```

8. **Rate Limiting**:
   - Transactional: 20/minute per user
   - Notifications: 100/hour per user
   - Marketing: Batch send, respect user preferences

### Output

After creating email system, provide:

1. **Email Templates Created**:
   - Template files: `emails/[name].tsx`
   - Types: Welcome, invitation, password reset, notification

2. **API Routes**:
   - Send endpoint: `app/api/send-email/route.ts`
   - Rate limiting: Configured

3. **Utilities**:
   - Email helper: `utils/email.ts`
   - Batch sending: Supported

4. **Testing**:
   ```bash
   # Preview emails
   npm run email:preview

   # Test send
   curl -X POST http://localhost:3000/api/send-email \
     -H "Content-Type: application/json" \
     -d '{"to":"test@example.com","type":"welcome","data":{...}}'
   ```

5. **Configuration Checklist**:
   - [ ] Resend API key in .env
   - [ ] From domain verified in Resend
   - [ ] Templates responsive
   - [ ] Plain text fallback
   - [ ] Error handling
   - [ ] Rate limiting
   - [ ] Activity logging

### Related Commands
- Create API route: Use `/api` for email sending endpoint
- Document: Use `/doc` to document email system
- Deploy: Use `/deploy` to verify email config

### Common Issues
- **Emails not sending**: Check Resend API key
- **Spam folder**: Verify domain, improve content
- **Styling broken**: Use inline CSS only
- **Slow sending**: Use batch send or queue
