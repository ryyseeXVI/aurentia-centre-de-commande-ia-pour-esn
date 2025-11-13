export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              1. Introduction
            </h2>
            <p className="text-muted-foreground">
              We are committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your
              information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              2. Information We Collect
            </h2>
            <p className="text-muted-foreground">
              We collect information you provide directly to us, such as:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>Email address and password when you create an account</li>
              <li>Profile information such as name and company</li>
              <li>Communication preferences and support requests</li>
              <li>Payment and billing information</li>
              <li>
                Usage data and analytics about your interactions with our
                service
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-muted-foreground">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>To provide, maintain, and improve our service</li>
              <li>To send transactional emails and account notifications</li>
              <li>To respond to your inquiries and support requests</li>
              <li>To detect, prevent, and address fraud and security issues</li>
              <li>To comply with legal obligations</li>
              <li>To send marketing communications (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              4. Data Security
            </h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to
              protect your personal data against unauthorized access,
              alteration, disclosure, or destruction. However, no method of
              transmission over the internet is 100% secure. While we strive to
              protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              5. Third-Party Services
            </h2>
            <p className="text-muted-foreground">
              We may share your information with third-party service providers
              who assist us in operating our service, including payment
              processors, email providers, and analytics services. These third
              parties are contractually obligated to use your information only
              as necessary to provide services to us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, please contact us at
              privacy@example.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookies</h2>
            <p className="text-muted-foreground">
              We use cookies and similar tracking technologies to track activity
              on our service and hold certain information. You can instruct your
              browser to refuse all cookies or to indicate when a cookie is
              being sent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              8. Changes to This Policy
            </h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new policy on this page
              and updating the effective date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please
              contact us at:
            </p>
            <p className="text-muted-foreground mt-4">
              Email: privacy@example.com
              <br />
              Address: 123 Business Street, City, State 12345
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-12">
            Last updated: October 30, 2025
          </p>
        </div>
      </div>
    </div>
  );
}
