import Link from "next/link";

const columns = [
  {
    title: "Candidates",
    links: [
      { href: "/", label: "Browse jobs" },
      { href: "/safety", label: "Safety tips" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Recruiters",
    links: [
      { href: "/dashboard/post", label: "Post a job" },
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create account" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/contact?topic=report", label: "Report a job" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Use" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-saffron to-saffron-dark text-white font-bold text-lg">
                J
              </div>
              <span className="text-xl font-bold tracking-tight">Joblay</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground leading-relaxed">
              Find roles across India and reach recruiters directly. No candidate
              accounts. No middle layer.
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-saffron transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-muted-foreground">
            The End
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Joblay. Joblay never charges candidates
            for jobs — report anyone who asks for money.
          </p>
        </div>
      </div>
    </footer>
  );
}
