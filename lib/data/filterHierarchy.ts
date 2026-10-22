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
  "Telecom",
  "Automobile",
  "Energy & Power",
  "FMCG",
  "Textile & Apparel",
  "Agriculture",
  "Aviation",
  "Consulting",
  "Government & PSU",
  "NGO & Social Work",
  "Beauty & Wellness",
  "Security Services",
  "Skilled Trades",
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
  Telecom: {
    Network: ["RF Engineer", "Telecom Engineer", "Fiber Optic Technician", "Tower Technician"],
    Operations: ["NOC Engineer", "Telecom Sales", "Field Technician"],
  },
  Automobile: {
    Engineering: ["Automobile Engineer", "R&D Engineer", "Vehicle Testing"],
    Service: ["Service Advisor", "Auto Mechanic", "Workshop Manager"],
    Sales: ["Car Sales Executive", "Dealership Manager", "Spare Parts Executive"],
  },
  "Energy & Power": {
    Power: ["Power Plant Engineer", "Transmission Engineer", "Substation Operator"],
    Renewables: ["Solar Engineer", "Wind Energy Technician", "Solar Installer"],
    "Oil & Gas": ["Petroleum Engineer", "Drilling Engineer", "HSE Officer"],
  },
  FMCG: {
    Sales: ["Sales Officer", "Area Sales Manager", "Distributor Manager", "Merchandiser"],
    Operations: ["Production Executive", "Food Technologist", "Quality Executive"],
  },
  "Textile & Apparel": {
    Production: ["Merchandiser", "Garment Technician", "Pattern Maker", "Tailor"],
    Design: ["Fashion Designer", "Textile Designer"],
  },
  Agriculture: {
    Farming: ["Agronomist", "Farm Manager", "Agriculture Officer"],
    "Agri Business": ["Agri Sales", "Dairy Technologist", "Seed Sales"],
  },
  Aviation: {
    Crew: ["Cabin Crew", "Pilot", "Ground Staff"],
    Technical: ["Aircraft Maintenance Engineer", "Air Traffic Controller"],
    Operations: ["Airport Operations", "Cargo Executive"],
  },
  Consulting: {
    Management: ["Management Consultant", "Strategy Analyst", "Associate Consultant"],
    "Risk & Advisory": ["Risk Consultant", "Tax Consultant", "Audit Associate"],
  },
  "Government & PSU": {
    Administration: ["Clerk", "Assistant", "Section Officer"],
    Technical: ["Junior Engineer", "Technical Officer", "Scientist"],
  },
  "NGO & Social Work": {
    Programs: ["Program Manager", "Field Coordinator", "Social Worker"],
    Fundraising: ["Fundraising Executive", "CSR Executive", "Grant Writer"],
  },
  "Beauty & Wellness": {
    Salon: ["Beautician", "Hair Stylist", "Makeup Artist", "Salon Manager"],
    Fitness: ["Gym Trainer", "Yoga Instructor", "Dietitian", "Spa Therapist"],
  },
  "Security Services": {
    Security: ["Security Guard", "Security Supervisor", "Bouncer", "CCTV Operator"],
  },
  "Skilled Trades": {
    Trades: ["Plumber", "Carpenter", "Welder", "Fitter", "Painter", "AC Technician"],
  },
};

/** Industry → sub-role → niche tags: the built-in list plus admin additions. */
export type Taxonomy = Record<string, Record<string, string[]>>;

/**
 * An admin-added category. Industry only → new industry; with subRole → new
 * role under that industry; with tag too → new skill under that role.
 */
export interface TaxonomyEntry {
  id: string;
  industry: string;
  subRole?: string;
  tag?: string;
  createdAt: string;
}

/** Built-in hierarchy with admin additions appended (built-in order first). */
export function mergeTaxonomy(entries: readonly TaxonomyEntry[]): Taxonomy {
  const out: Taxonomy = {};
  for (const [industry, roles] of Object.entries(industryHierarchy)) {
    out[industry] = Object.fromEntries(Object.entries(roles).map(([r, tags]) => [r, [...tags]]));
  }
  // Parents before children, so a role added before its industry still lands.
  const depth = (e: TaxonomyEntry) => (e.tag ? 2 : e.subRole ? 1 : 0);
  for (const e of [...entries].sort((a, b) => depth(a) - depth(b))) {
    if (!e.subRole) {
      out[e.industry] ??= {};
    } else if (!e.tag) {
      if (out[e.industry]) out[e.industry][e.subRole] ??= [];
    } else {
      const tags = out[e.industry]?.[e.subRole];
      if (tags && !tags.includes(e.tag)) tags.push(e.tag);
    }
  }
  return out;
}

export function getSubRoles(industry: string, taxonomy: Taxonomy = industryHierarchy): string[] {
  if (!industry || !Object.hasOwn(taxonomy, industry)) return [];
  return Object.keys(taxonomy[industry]);
}

export function getNicheTags(
  industry: string,
  subRole: string,
  taxonomy: Taxonomy = industryHierarchy
): string[] {
  if (!industry || !Object.hasOwn(taxonomy, industry)) return [];
  const roles = taxonomy[industry];
  return Object.hasOwn(roles, subRole) ? roles[subRole] : [];
}

export const includes = <T extends string>(list: readonly T[], value: string): value is T =>
  (list as readonly string[]).includes(value);
