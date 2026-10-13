import Link from "next/link";
import { Info } from "lucide-react";
import { ContentPage } from "@/components/layout/ContentPage";

export const metadata = {
  title: "About",
  description:
    "Joblay is a direct-outreach job board: candidates find roles and contact recruiters directly.",
};

export default function AboutPage() {
  return (
    <ContentPage
      icon={Info}
      title="About Joblay"
      intro="A job board without the middle layer. Find a role, then call, WhatsApp or email the recruiter yourself."
    >
      <h2>Why we built it</h2>
      <p>
        Most job portals ask candidates to create a profile, upload a resume and
        then wait — often without hearing back. Joblay removes that step. Every
        listing shows the recruiter&apos;s own contact details, so you can reach
        the person doing the hiring directly.
      </p>

      <h2>How it works for candidates</h2>
      <ul>
        <li>Browse open roles — no sign-up, no profile, no resume upload.</li>
        <li>
          Filter by location, job profile and industry, then narrow down with
          sub-roles and niche tags (for example IT → Developer → Java, Python).
        </li>
        <li>
          Use the <strong>Number</strong> button to call or WhatsApp, or the{" "}
          <strong>Email</strong> button to write to the recruiter.
        </li>
      </ul>

      <h2>How it works for recruiters</h2>
      <ul>
        <li>Create a free recruiter account.</li>
        <li>
          Post a job with clear criteria and at least one way to contact you —
          name, email or phone.
        </li>
        <li>Manage and remove your postings from your dashboard.</li>
      </ul>

      <h2>Our promise</h2>
      <p>
        Joblay never charges candidates. A genuine employer will never ask you to
        pay for an interview, training, a uniform or a joining kit. Read our{" "}
        <Link href="/safety">safety tips</Link> and{" "}
        <Link href="/contact?topic=report">report</Link> any listing that looks
        wrong.
      </p>

      <p>
        Questions or feedback? <Link href="/contact">Get in touch</Link>.
      </p>
    </ContentPage>
  );
}
