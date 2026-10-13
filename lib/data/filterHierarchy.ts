/**
 * Every option list used by the job filters and the post form.
 * Values are stored as-is in the database, so rename with care.
 */

export const locations = [
  "Pan India",
  "Ahmedabad",
  "Bangalore",
  "Bhopal",
  "Bhubaneswar",
  "Chandigarh",
  "Chennai",
  "Coimbatore",
  "Delhi",
  "Gurgaon",
  "Noida",
  "Goa",
  "Guwahati",
  "Hyderabad",
  "Indore",
  "Jaipur",
  "Kochi",
  "Kolkata",
  "Lucknow",
  "Mumbai",
  "Navi Mumbai",
  "Thane",
  "Mysore",
  "Nagpur",
  "Nashik",
  "Patna",
  "Pune",
  "Surat",
  "Thiruvananthapuram",
  "Vadodara",
  "Visakhapatnam",
] as const;

/** Seniority. Kept as `jobProfile` in code for backwards compatibility. */
export const jobProfiles = [
  "Fresher",
  "Junior",
  "Mid-Level",
  "Senior",
  "Lead",
  "Manager",
  "Director",
] as const;

export const workModes = ["Office", "Remote", "Hybrid"] as const;

export const jobTypes = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
  "Temporary",
] as const;

export const educationLevels = [
  "Any",
  "10th Pass",
  "12th Pass",
  "Diploma / ITI",
  "Graduate",
  "Post Graduate",
  "Doctorate",
] as const;

/** "Posted within" filter, in days. */
export const postedWithinOptions = [
  { value: "1", label: "Last 24 hours" },
  { value: "3", label: "Last 3 days" },
  { value: "7", label: "Last 7 days" },
  { value: "15", label: "Last 15 days" },
  { value: "30", label: "Last 30 days" },
] as const;

/** Minimum salary filter, in lakhs per annum (LPA). */
export const salaryOptions = [
  { value: "1", label: "1+ LPA" },
  { value: "3", label: "3+ LPA" },
  { value: "6", label: "6+ LPA" },
  { value: "10", label: "10+ LPA" },
  { value: "15", label: "15+ LPA" },
  { value: "25", label: "25+ LPA" },
  { value: "50", label: "50+ LPA" },
] as const;

export const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "salary", label: "Highest salary" },
  { value: "experience", label: "Least experience" },
] as const;

export const MAX_EXPERIENCE_YEARS = 30;

export const industries = [
  "IT",
  "Sales & Marketing",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Engineering",
  "Construction & Real Estate",
  "Logistics",
  "Retail & E-commerce",
  "Hospitality",
  "Media & Design",
  "HR & Admin",
  "Customer Support",
  "Legal",
] as const;

export type Industry = (typeof industries)[number];

/** Industry → sub-role → niche tags (multi-select). */
export const industryHierarchy: Record<Industry, Record<string, string[]>> = {
  IT: {
    Developer: [
      "Java Developer",
      "Python Developer",
      "React Developer",
      "Angular Developer",
      "Node.js Developer",
      ".NET Developer",
      "PHP Developer",
      "Golang Developer",
      "Full Stack Developer",
      "Android Developer",
      "iOS Developer",
      "Flutter Developer",
      "React Native Developer",
    ],
    Tester: [
      "Manual Tester",
      "Automation Tester",
      "Selenium",
      "API Testing",
      "Performance Tester",
      "QA Lead",
    ],
    SAP: ["SAP FICO", "SAP MM", "SAP SD", "SAP ABAP", "SAP Basis", "SAP HANA", "SAP SuccessFactors"],
    "DevOps & Cloud": ["AWS", "Azure", "GCP", "DevOps Engineer", "Kubernetes", "SRE", "Linux Admin"],
    "Data & AI": [
      "Data Analyst",
      "Data Engineer",
      "Data Scientist",
      "ML Engineer",
      "GenAI / LLM",
      "Power BI",
      "SQL",
    ],
    Design: ["UI/UX Designer", "Product Designer", "Graphic Designer"],
    "IT Support": ["Desktop Support", "Network Engineer", "System Admin", "Helpdesk"],
    Security: ["Cyber Security Analyst", "SOC Analyst", "Penetration Tester"],
    "Product & Project": ["Product Manager", "Project Manager", "Scrum Master", "Business Analyst"],
  },
  "Sales & Marketing": {
    Sales: ["Field Sales", "Inside Sales", "B2B Sales", "Business Development", "Telesales", "Key Account Manager"],
    Marketing: ["Digital Marketing", "SEO", "Social Media", "Performance Marketing", "Content Writer", "Brand Manager"],
  },
  Finance: {
    Banking: ["Relationship Manager", "Credit Analyst", "Branch Manager", "Loan Officer"],
    Accounting: ["Chartered Accountant", "Accountant", "Tally", "GST / Taxation", "Auditor"],
    "Finance & Analysis": ["Financial Analyst", "FP&A", "Investment Banking", "Equity Research"],
    Insurance: ["Insurance Advisor", "Underwriter", "Claims Executive"],
  },
  Healthcare: {
    Clinical: ["Doctor", "Nurse", "Pharmacist", "Lab Technician", "Physiotherapist", "Dentist"],
    Admin: ["Hospital Admin", "Medical Records", "Medical Coder", "Healthcare IT"],
    Pharma: ["Medical Representative", "Clinical Research", "Quality Assurance", "Regulatory Affairs"],
  },
  Education: {
    Teaching: ["School Teacher", "Professor", "Tutor", "Online Tutor", "Special Educator"],
    Admin: ["Academic Coordinator", "Principal", "Counselor", "Admission Counselor"],
    Training: ["Corporate Trainer", "Instructional Designer"],
  },
  Manufacturing: {
    Operations: ["Production Engineer", "Plant Manager", "Shift Supervisor", "Machine Operator"],
    Quality: ["Quality Control", "Quality Assurance", "Six Sigma"],
    Supply: ["Supply Chain Manager", "Procurement", "Purchase Executive", "Store Keeper"],
  },
  Engineering: {
    Mechanical: ["Design Engineer", "Maintenance Engineer", "AutoCAD", "SolidWorks"],
    Electrical: ["Electrical Engineer", "Electrician", "PLC / SCADA"],
    Civil: ["Site Engineer", "Structural Engineer", "Quantity Surveyor"],
    Electronics: ["Embedded Engineer", "VLSI", "Hardware Engineer"],
  },
  "Construction & Real Estate": {
    Construction: ["Site Supervisor", "Project Engineer", "Safety Officer"],
    "Real Estate": ["Real Estate Sales", "Property Manager", "Leasing Executive"],
  },
  Logistics: {
    Operations: ["Logistics Coordinator", "Warehouse Manager", "Fleet Manager", "Dispatch Executive"],
    Delivery: ["Delivery Executive", "Driver", "Courier"],
  },
  "Retail & E-commerce": {
    Store: ["Store Manager", "Sales Associate", "Cashier", "Visual Merchandiser"],
    "E-commerce": ["Catalog Executive", "Category Manager", "Marketplace Manager"],
  },
  Hospitality: {
    Hotel: ["Front Office", "Housekeeping", "F&B Service", "Hotel Manager"],
    Kitchen: ["Chef", "Cook", "Kitchen Helper"],
    Travel: ["Travel Consultant", "Ticketing Executive"],
  },
  "Media & Design": {
    Creative: ["Video Editor", "Photographer", "Animator", "Motion Graphics"],
    Content: ["Copywriter", "Journalist", "Anchor"],
  },
  "HR & Admin": {
    HR: ["HR Executive", "Recruiter", "HR Business Partner", "Payroll", "Talent Acquisition"],
    Admin: ["Office Admin", "Receptionist", "Executive Assistant", "Data Entry"],
  },
  "Customer Support": {
    Voice: ["Voice Process", "International Voice", "Domestic Voice"],
    "Non-voice": ["Chat Support", "Email Support", "Back Office"],
  },
  Legal: {
    Legal: ["Corporate Lawyer", "Legal Advisor", "Company Secretary", "Paralegal"],
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

export const includes = <T extends string>(list: readonly T[], value: string): value is T =>
  (list as readonly string[]).includes(value);
