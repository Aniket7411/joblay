import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ContentPage } from "@/components/layout/ContentPage";

export const metadata = {
  title: "Safety Tips",
  description:
    "How to spot fake job offers and stay safe when contacting recruiters directly.",
};

export default function SafetyPage() {
  return (
    <ContentPage
      icon={ShieldCheck}
      title="Stay safe while job hunting"
      intro="On Joblay you contact recruiters directly. That's faster — and it means you should know the warning signs of a fake job."
    >
      <h2>Never pay to get a job</h2>
      <p>
        A real employer will <strong>never</strong> ask you to pay for an
        interview, registration, training, a security deposit, a uniform, a
        laptop or a &quot;joining kit&quot;. If anyone asks for money, it is a
        scam — stop responding and report the listing.
      </p>

      <h2>Warning signs</h2>
      <ul>
        <li>An offer letter without any interview, or a salary that seems too good to be true.</li>
        <li>Pressure to decide or pay &quot;today only&quot;.</li>
        <li>
          The recruiter uses a free email address but claims to be from a large
          company, or the company name doesn&apos;t match the email domain.
        </li>
        <li>Requests to move the conversation to an unknown app or to install software.</li>
        <li>Interviews held only over chat, or at a hotel or private home.</li>
        <li>Spelling mistakes and vague details about the role and company.</li>
      </ul>

      <h2>Protect your personal information</h2>
      <ul>
        <li>
          Don&apos;t share your Aadhaar, PAN, bank details, card numbers or OTPs
          before you have a verified written offer — and never share OTPs at all.
        </li>
        <li>Don&apos;t click payment links or scan QR codes sent by a recruiter.</li>
        <li>Share your resume by email rather than on public groups.</li>
      </ul>

      <h2>Verify before you go</h2>
      <ul>
        <li>Search the company&apos;s official website and check its careers page.</li>
        <li>Call the company&apos;s published phone number to confirm the opening.</li>
        <li>
          For in-person interviews, meet at the company&apos;s office during work
          hours and tell a friend or family member where you&apos;re going.
        </li>
      </ul>

      <h2>If something feels wrong</h2>
      <p>
        <Link href="/contact?topic=report">Report the listing</Link> to us with
        the job title and company name, and we&apos;ll review it. If you&apos;ve
        lost money, report it immediately at{" "}
        <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">
          cybercrime.gov.in
        </a>{" "}
        or call the national cyber crime helpline <strong>1930</strong>.
      </p>
    </ContentPage>
  );
}
