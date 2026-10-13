import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { ContentPage } from "@/components/layout/ContentPage";

export const metadata = {
  title: "FAQ",
  description: "Answers to common questions from candidates and recruiters.",
};

const sections: { heading: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    heading: "For candidates",
    items: [
      {
        q: "Do I need an account to apply?",
        a: "No. Candidates don't sign up on Joblay. Find a role you like and contact the recruiter directly using the Number or Email button on the job card.",
      },
      {
        q: "How do I apply for a job?",
        a: "Call or WhatsApp the recruiter, or email them with your resume. Mention the job title and where you found it so they know which role you mean.",
      },
      {
        q: "Is Joblay free for candidates?",
        a: (
          <>
            Yes, always. Joblay never charges candidates, and genuine employers
            don&apos;t either. Read our <Link href="/safety">safety tips</Link>.
          </>
        ),
      },
      {
        q: "A recruiter isn't replying. What should I do?",
        a: "Recruiters handle responses themselves, so reply times vary. Wait a few working days, then follow up once. Joblay can't contact recruiters on your behalf.",
      },
      {
        q: "How do I report a suspicious job?",
        a: (
          <>
            Use the <Link href="/contact?topic=report">report form</Link> with the
            job title and company name. We review every report.
          </>
        ),
      },
    ],
  },
  {
    heading: "For recruiters",
    items: [
      {
        q: "How much does it cost to post a job?",
        a: "Posting jobs on Joblay is currently free.",
      },
      {
        q: "What contact details do I need to provide?",
        a: "At least one of your name, email address or phone number. Candidates will use these to contact you, so we recommend adding both a phone number and an email.",
      },
      {
        q: "Can I attach a full job description?",
        a: "Yes. When posting, you can attach a PDF or Word file up to 5 MB. Candidates see a “View full JD” link on your listing.",
      },
      {
        q: "How do I remove a job once it's filled?",
        a: (
          <>
            Sign in, open your <Link href="/dashboard">dashboard</Link> and click
            Delete on the posting. It&apos;s removed from the site immediately.
          </>
        ),
      },
      {
        q: "I forgot my password.",
        a: (
          <>
            Use <Link href="/forgot-password">Forgot password</Link>. We&apos;ll
            email you a reset link that works once and expires after 1 hour.
          </>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <ContentPage
      icon={HelpCircle}
      title="Frequently asked questions"
      intro="Quick answers for candidates and recruiters."
    >
      {sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          <div className="space-y-3">
            {section.items.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border bg-surface px-5 py-4"
              >
                <summary className="cursor-pointer list-none font-medium text-foreground flex items-center justify-between gap-4">
                  {item.q}
                  <span className="text-saffron transition-transform group-open:rotate-45 text-xl leading-none">
                    +
                  </span>
                </summary>
                <p className="mt-3 mb-0">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <p className="mt-10">
        Still have a question? <Link href="/contact">Contact us</Link>.
      </p>
    </ContentPage>
  );
}
