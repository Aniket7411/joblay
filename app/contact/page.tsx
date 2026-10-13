import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";
import { contactTopics, type ContactFormData } from "@/lib/validations";

export const metadata = {
  title: "Contact",
  description: "Get in touch with Joblay or report a suspicious job listing.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const initialTopic = (
    contactTopics.some((t) => t.value === topic) ? topic : "general"
  ) as ContactFormData["topic"];

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <header className="mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron/10 text-saffron mb-5">
          <MessageSquare className="h-6 w-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Contact us
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          Questions, feedback, or a listing that doesn&apos;t look right? Send us
          a message.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Looking to apply for a job? Contact the recruiter directly using the
          buttons on the{" "}
          <Link href="/" className="text-saffron hover:underline">
            job listing
          </Link>
          .
        </p>
      </header>

      <ContactForm key={initialTopic} initialTopic={initialTopic} />
    </div>
  );
}
