export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { printStartupStatus } = await import("@/lib/startup");
  try {
    await printStartupStatus();
  } catch (err) {
    console.error("[startup] status check failed", err);
  }
}
