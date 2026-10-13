import ExcelJS from "exceljs";
import { fail, serverError } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/auth/current";
import { listContactMessages, listJobs, listRecruiters } from "@/lib/repository";
import { contactTopics } from "@/lib/validations";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFF9933" },
};

const dateOrBlank = (iso?: string) => (iso ? new Date(iso) : null);

function addSheet<T>(
  wb: ExcelJS.Workbook,
  name: string,
  columns: { header: string; width: number; value: (row: T) => unknown }[],
  rows: T[]
) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = columns.map((c) => ({ header: c.header, width: c.width }));
  for (const row of rows) ws.addRow(columns.map((c) => c.value(row)));

  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = HEADER_FILL;
  header.alignment = { vertical: "middle" };
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  // Show Date cells as dates.
  columns.forEach((c, i) => {
    if (/date|joined|login|posted|updated|received|expires/i.test(c.header)) {
      ws.getColumn(i + 1).numFmt = "dd-mmm-yyyy hh:mm";
    }
  });
  return ws;
}

function countBy<T>(items: T[], key: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return fail("Admins only", 403);

    const [jobs, recruiters, messages] = await Promise.all([
      listJobs(),
      listRecruiters(),
      listContactMessages(),
    ]);
    const byId = new Map(recruiters.map((r) => [r.id, r]));
    const topicLabel = (t: string) => contactTopics.find((x) => x.value === t)?.label ?? t;

    const wb = new ExcelJS.Workbook();
    wb.creator = "Joblay";
    wb.created = new Date();

    // Summary
    const summary = wb.addWorksheet("Summary");
    summary.columns = [{ width: 32 }, { width: 14 }];
    const section = (title: string, rows: [string, number][]) => {
      const t = summary.addRow([title]);
      t.font = { bold: true, size: 12 };
      rows.forEach((r) => summary.addRow(r));
      summary.addRow([]);
    };
    summary.addRow(["Joblay export"]).font = { bold: true, size: 16 };
    summary.addRow([`Generated ${new Date().toLocaleString("en-IN")} by ${admin.email}`]);
    summary.addRow([]);
    section("Totals", [
      ["Jobs", jobs.length],
      ["Employers (active)", recruiters.filter((r) => r.role === "recruiter" && r.status === "active").length],
      ["Employers (suspended)", recruiters.filter((r) => r.status === "suspended").length],
      ["Admins", recruiters.filter((r) => r.role === "admin").length],
      ["Messages (open)", messages.filter((m) => m.status === "open").length],
      ["Messages (total)", messages.length],
    ]);
    section("Jobs by industry", countBy(jobs, (j) => j.industry));
    section("Jobs by location", countBy(jobs, (j) => j.location));
    section("Jobs by work mode", countBy(jobs, (j) => j.workMode));
    section("Jobs by job type", countBy(jobs, (j) => j.jobType));
    section("Jobs by profile", countBy(jobs, (j) => j.jobProfile));

    addSheet(
      wb,
      "Jobs",
      [
        { header: "Job ID", width: 38, value: (j) => j.id },
        { header: "Title", width: 30, value: (j) => j.title },
        { header: "Company", width: 24, value: (j) => j.company },
        { header: "Location", width: 14, value: (j) => j.location },
        { header: "Profile", width: 12, value: (j) => j.jobProfile },
        { header: "Industry", width: 14, value: (j) => j.industry },
        { header: "Sub-role", width: 14, value: (j) => j.subRole },
        { header: "Skills", width: 30, value: (j) => j.tags.join(", ") },
        { header: "Work mode", width: 11, value: (j) => j.workMode },
        { header: "Job type", width: 12, value: (j) => j.jobType },
        { header: "Exp min (yrs)", width: 12, value: (j) => j.experienceMin },
        { header: "Exp max (yrs)", width: 12, value: (j) => j.experienceMax },
        { header: "Salary min (LPA)", width: 14, value: (j) => j.salaryMin ?? "" },
        { header: "Salary max (LPA)", width: 14, value: (j) => j.salaryMax ?? "" },
        { header: "Education", width: 14, value: (j) => j.education },
        { header: "Openings", width: 10, value: (j) => j.openings },
        { header: "Status", width: 10, value: (j) => (j.status === "closed" ? "closed" : new Date(j.expiresAt) <= new Date() ? "expired" : "live") },
        { header: "Expires", width: 18, value: (j) => dateOrBlank(j.expiresAt) },
        { header: "Description", width: 60, value: (j) => j.description },
        { header: "Criteria", width: 50, value: (j) => j.criteria.join("\n") },
        { header: "Contact name", width: 20, value: (j) => j.contact.name ?? "" },
        { header: "Contact email", width: 28, value: (j) => j.contact.email ?? "" },
        { header: "Contact phone", width: 18, value: (j) => j.contact.phone ?? "" },
        { header: "Attachment URL", width: 40, value: (j) => j.attachmentUrl ?? "" },
        { header: "Employer name", width: 20, value: (j) => byId.get(j.recruiterId)?.name ?? "" },
        { header: "Employer email", width: 28, value: (j) => byId.get(j.recruiterId)?.email ?? "" },
        { header: "Employer status", width: 14, value: (j) => byId.get(j.recruiterId)?.status ?? "" },
        { header: "Posted", width: 18, value: (j) => dateOrBlank(j.createdAt) },
        { header: "Updated", width: 18, value: (j) => dateOrBlank(j.updatedAt) },
      ],
      jobs
    );

    addSheet(
      wb,
      "Employers",
      [
        { header: "Employer ID", width: 38, value: (r) => r.id },
        { header: "Name", width: 22, value: (r) => r.name },
        { header: "Email", width: 30, value: (r) => r.email },
        { header: "Company", width: 24, value: (r) => r.company ?? "" },
        { header: "Role", width: 10, value: (r) => r.role },
        { header: "Status", width: 11, value: (r) => r.status },
        { header: "Jobs posted", width: 11, value: (r) => r.jobCount },
        { header: "Joined", width: 18, value: (r) => dateOrBlank(r.createdAt) },
        { header: "Last login", width: 18, value: (r) => dateOrBlank(r.lastLoginAt) },
      ],
      recruiters
    );

    addSheet(
      wb,
      "Messages",
      [
        { header: "Received", width: 18, value: (m) => dateOrBlank(m.createdAt) },
        { header: "Status", width: 10, value: (m) => m.status },
        { header: "Topic", width: 22, value: (m) => topicLabel(m.topic) },
        { header: "Name", width: 20, value: (m) => m.name },
        { header: "Email", width: 28, value: (m) => m.email },
        { header: "Message", width: 80, value: (m) => m.message },
      ],
      messages
    );

    const buffer = await wb.xlsx.writeBuffer();
    const filename = `joblay-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    console.info(`[admin] ${admin.email} downloaded ${filename}`);

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return serverError(err, "admin/export");
  }
}
