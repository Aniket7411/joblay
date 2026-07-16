export const locations = [
  "Mumbai",
  "Bangalore",
  "Delhi",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Kolkata",
  "Remote",
] as const;

export const jobProfiles = [
  "Junior",
  "Mid-Level",
  "Senior",
  "Lead",
  "Manager",
] as const;

export const industries = [
  "IT",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Education",
] as const;

export type Industry = (typeof industries)[number];

/** Industry → subfilter role → niche tags */
export const industryHierarchy: Record<
  Industry,
  Record<string, string[]>
> = {
  IT: {
    Developer: [
      "Java Developer",
      "Python Developer",
      "React Developer",
      "Node.js Developer",
      "Full Stack Developer",
    ],
    Tester: [
      "Manual Tester",
      "Automation Tester",
      "QA Lead",
      "Performance Tester",
    ],
    SAP: ["SAP FICO", "SAP MM", "SAP ABAP", "SAP Basis"],
  },
  Healthcare: {
    Clinical: ["Nurse", "Doctor", "Pharmacist", "Lab Technician"],
    Admin: ["Hospital Admin", "Medical Records", "Healthcare IT"],
  },
  Finance: {
    Banking: ["Relationship Manager", "Credit Analyst", "Branch Manager"],
    Accounting: ["Chartered Accountant", "Financial Analyst", "Auditor"],
  },
  Manufacturing: {
    Operations: ["Production Engineer", "Plant Manager", "Quality Control"],
    Supply: ["Supply Chain Manager", "Logistics Coordinator", "Procurement"],
  },
  Education: {
    Teaching: ["School Teacher", "Professor", "Tutor"],
    Admin: ["Academic Coordinator", "Principal", "Counselor"],
  },
};

export function getSubRoles(industry: string): string[] {
  if (!industry || !(industry in industryHierarchy)) return [];
  return Object.keys(industryHierarchy[industry as Industry]);
}

export function getNicheTags(industry: string, subRole: string): string[] {
  if (!industry || !(industry in industryHierarchy)) return [];
  const hierarchy = industryHierarchy[industry as Industry];
  return hierarchy[subRole] ?? [];
}
