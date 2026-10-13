import Link from "next/link";
import { FileText } from "lucide-react";
import { ContentPage } from "@/components/layout/ContentPage";

export const metadata = {
  title: "Terms of Use",
  description: "The terms that apply when you use Joblay.",
};

export default function TermsPage() {
  return (
    <ContentPage
      icon={FileText}
      title="Terms of Use"
      updated="13 October 2026"
      intro="By using Joblay you agree to these terms. Please read them carefully."
    >
      <h2>1. The service</h2>
      <p>
        Joblay is a listing platform. Recruiters post jobs and candidates
        contact recruiters directly. Joblay is <strong>not</strong> an employer,
        recruitment agency or party to any hiring decision, and we don&apos;t
        process applications.
      </p>

      <h2>2. Eligibility</h2>
      <p>You must be at least 18 years old to use Joblay.</p>

      <h2>3. Recruiter accounts</h2>
      <ul>
        <li>Provide accurate information and keep your password confidential.</li>
        <li>You are responsible for all activity on your account.</li>
        <li>Tell us promptly if you suspect unauthorised use.</li>
      </ul>

      <h2>4. Job posting rules</h2>
      <p>Recruiters must only post genuine, currently open roles. You must not post anything that:</p>
      <ul>
        <li>Asks candidates for any payment, fee or deposit.</li>
        <li>Is misleading about the employer, role, location or pay.</li>
        <li>Is discriminatory, unlawful, or promotes multi-level marketing or pyramid schemes.</li>
        <li>Contains malware, or contact details you aren&apos;t authorised to share.</li>
        <li>Collects candidates&apos; personal data for purposes other than the advertised role.</li>
      </ul>
      <p>
        We may edit or remove any listing, and suspend any account, that we
        believe breaks these rules — without notice.
      </p>

      <h2>5. Candidates</h2>
      <p>
        Listings are created by recruiters, not by Joblay. We don&apos;t verify
        every listing and can&apos;t guarantee that any job is genuine,
        available or suitable. Do your own checks before sharing personal
        information — see our <Link href="/safety">safety tips</Link>.
      </p>

      <h2>6. Acceptable use</h2>
      <p>
        Don&apos;t scrape, copy or harvest listings or contact details in bulk,
        send spam, attempt to access other accounts, or interfere with the
        service.
      </p>

      <h2>7. Content</h2>
      <p>
        Recruiters keep ownership of what they post, and give Joblay permission
        to display it on the service. The Joblay name, design and software
        belong to Joblay.
      </p>

      <h2>8. Disclaimer</h2>
      <p>
        Joblay is provided &quot;as is&quot; and &quot;as available&quot;. To
        the extent permitted by law, we give no warranties about the service or
        any listing, and aren&apos;t liable for any loss arising from
        interactions, offers or agreements between candidates and recruiters.
      </p>

      <h2>9. Changes and termination</h2>
      <p>
        We may change these terms or the service at any time. Continued use
        after a change means you accept the updated terms. You may stop using
        Joblay at any time.
      </p>

      <h2>10. Governing law</h2>
      <p>These terms are governed by the laws of India.</p>

      <h2>11. Contact</h2>
      <p>
        Questions about these terms? <Link href="/contact">Contact us</Link>.
      </p>
    </ContentPage>
  );
}
