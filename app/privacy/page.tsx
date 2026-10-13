import Link from "next/link";
import { Lock } from "lucide-react";
import { ContentPage } from "@/components/layout/ContentPage";

export const metadata = {
  title: "Privacy Policy",
  description: "How Joblay collects, uses and protects personal data.",
};

export default function PrivacyPage() {
  return (
    <ContentPage
      icon={Lock}
      title="Privacy Policy"
      updated="13 October 2026"
      intro="This policy explains what personal data Joblay collects, why, and the choices you have."
    >
      <h2>1. Who this applies to</h2>
      <p>
        Joblay is a job board where <strong>candidates</strong> browse jobs
        without an account and <strong>recruiters</strong> create an account to
        post jobs. This policy covers both, and visitors who use our contact
        form.
      </p>

      <h2>2. What we collect</h2>
      <p><strong>Candidates.</strong> We don&apos;t ask candidates to register or upload anything. We don&apos;t collect your name, resume or contact details. When you contact a recruiter, that happens directly between you and them by phone, WhatsApp or email — outside Joblay.</p>
      <p><strong>Recruiters.</strong> When you register we collect your name, email address, optional company name and a password (stored only as a secure one-way hash). For each job you post we store the job details, the contact details you choose to publish and any attachment you upload.</p>
      <p><strong>Contact form.</strong> Your name, email address and message.</p>
      <p><strong>Technical data.</strong> A strictly necessary session cookie keeps recruiters signed in. Our hosting provider may log standard request data such as IP address and browser type for security and reliability. We don&apos;t use advertising or tracking cookies.</p>

      <h2>3. How we use it</h2>
      <ul>
        <li>To run recruiter accounts, including sign-in and password reset.</li>
        <li>To publish job listings, including the contact details recruiters choose to show.</li>
        <li>To send service emails, such as a welcome email or a password reset link.</li>
        <li>To respond to messages and review reports of suspicious listings.</li>
        <li>To keep the service secure and prevent abuse.</li>
      </ul>
      <p>We don&apos;t sell personal data or use it for advertising.</p>

      <h2>4. Information recruiters publish</h2>
      <p>
        Contact details and attachments added to a job listing are public by
        design so candidates can reach the recruiter. Only publish details you
        are authorised to share. Deleting a listing removes it from the site.
      </p>

      <h2>5. Service providers</h2>
      <p>
        We use trusted providers to run Joblay: database hosting (MongoDB Atlas),
        file storage (Supabase), email delivery (Google) and website hosting.
        They process data only to provide their services to us. Data may be
        stored on servers outside India.
      </p>

      <h2>6. How long we keep data</h2>
      <p>
        Recruiter account data is kept while the account is active. Job
        listings are kept until the recruiter deletes them. Password reset links
        expire after 1 hour. Contact messages are kept only as long as needed to
        respond.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Subject to applicable law, including India&apos;s Digital Personal Data
        Protection Act, 2023, you can ask to access, correct or delete your
        personal data, or withdraw consent. Recruiters can delete their listings
        from the dashboard at any time. For anything else,{" "}
        <Link href="/contact">contact us</Link> and we&apos;ll respond within a
        reasonable time.
      </p>

      <h2>8. Security</h2>
      <p>
        Passwords are hashed, sessions use signed secure cookies, and the site
        is served over HTTPS. No method of transmission or storage is completely
        secure, but we work to protect your data.
      </p>

      <h2>9. Children</h2>
      <p>Joblay is not intended for anyone under 18.</p>

      <h2>10. Changes</h2>
      <p>
        We may update this policy. The date at the top shows when it last
        changed.
      </p>

      <h2>11. Contact</h2>
      <p>
        For privacy questions or requests, use our{" "}
        <Link href="/contact?topic=privacy">contact form</Link>.
      </p>
    </ContentPage>
  );
}
