/**
 * Browser-side: counts a job view or contact tap for the recruiter's
 * dashboard, at most once per job per browser session. Fire and forget.
 */
export function trackJob(jobId: string, kind: "view" | "contact"): void {
  const key = `joblay-stat:${kind}:${jobId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // storage blocked: still count, just without de-duplication
  }
  fetch(`/api/jobs/${encodeURIComponent(jobId)}/stats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
    keepalive: true,
  }).catch(() => {});
}
