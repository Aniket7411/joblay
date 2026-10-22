import type { JobPosting } from "@/types";

/** Sample jobs for the in-memory dev store (only used without Supabase). */

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();
const expiresIn = (n: number) => new Date(Date.now() + n * DAY).toISOString();

type Seed = Omit<JobPosting, "status" | "expiresAt" | "createdAt" | "openings" | "education"> &
  Partial<Pick<JobPosting, "openings" | "education">> & { postedDaysAgo: number };

const seeds: Seed[] = [
  {
    id: "job-1", recruiterId: "rec-1", title: "Senior Java Developer", company: "TechNova Solutions",
    location: "Bangalore", jobProfile: "Senior", industry: "IT", subRole: "Developer",
    tags: ["Java Developer"], workMode: "Hybrid", jobType: "Full-time",
    experienceMin: 5, experienceMax: 8, salaryMin: 18, salaryMax: 28, education: "Graduate", openings: 3,
    description: "Build scalable Spring Boot microservices for our fintech platform with a cross-functional agile team.",
    criteria: ["5+ years Java", "Spring Boot & microservices", "Strong problem-solving skills"],
    contact: { name: "Anita Desai", email: "anita@technova.example", phone: "+919876543210" },
    postedDaysAgo: 1,
  },
  {
    id: "job-2", recruiterId: "rec-2", title: "Python Backend Engineer", company: "DataPulse AI",
    location: "Pan India", jobProfile: "Mid-Level", industry: "IT", subRole: "Developer",
    tags: ["Python Developer"], workMode: "Remote", jobType: "Full-time",
    experienceMin: 2, experienceMax: 5, salaryMin: 10, salaryMax: 16,
    description: "Develop ML pipeline APIs and data ingestion services for our AI products. Fully remote team.",
    criteria: ["3+ years Python", "FastAPI or Django", "Cloud experience (AWS/GCP)"],
    contact: { email: "hiring@datapulse.example", phone: "+919988776655" },
    postedDaysAgo: 2,
  },
  {
    id: "job-3", recruiterId: "rec-1", title: "Automation QA Lead", company: "TechNova Solutions",
    location: "Pune", jobProfile: "Lead", industry: "IT", subRole: "Tester",
    tags: ["Automation Tester", "Selenium", "QA Lead"], workMode: "Office", jobType: "Full-time",
    experienceMin: 6, experienceMax: 10, salaryMin: 15, salaryMax: 22,
    description: "Lead QA automation strategy across multiple product squads using Selenium and Cypress.",
    criteria: ["6+ years in QA", "Selenium, Cypress, CI/CD", "Team leadership experience"],
    contact: { name: "Rahul Mehta", email: "rahul@technova.example" },
    postedDaysAgo: 4,
  },
  {
    id: "job-4", recruiterId: "rec-3", title: "SAP FICO Consultant", company: "Enterprise ERP Co.",
    location: "Mumbai", jobProfile: "Senior", industry: "IT", subRole: "SAP",
    tags: ["SAP FICO"], workMode: "Hybrid", jobType: "Contract",
    experienceMin: 4, experienceMax: 9, salaryMin: 14, salaryMax: 20,
    description: "Implement and support SAP FICO modules for enterprise clients in the manufacturing sector.",
    criteria: ["SAP FICO certification", "4+ years implementation", "Strong client communication"],
    contact: { name: "Vikram Shah", phone: "+919123456789" },
    postedDaysAgo: 6,
  },
  {
    id: "job-5", recruiterId: "rec-4", title: "React Frontend Developer (Fresher)", company: "PixelCraft Studio",
    location: "Hyderabad", jobProfile: "Fresher", industry: "IT", subRole: "Developer",
    tags: ["React Developer"], workMode: "Office", jobType: "Full-time",
    experienceMin: 0, experienceMax: 1, salaryMin: 3.5, salaryMax: 5, education: "Graduate", openings: 5,
    description: "Craft responsive, accessible UIs for SaaS dashboards using React and TypeScript. Training provided.",
    criteria: ["B.Tech / BCA / MCA", "Basics of React and JavaScript", "Eye for design"],
    contact: { email: "careers@pixelcraft.example" },
    postedDaysAgo: 0,
  },
  {
    id: "job-6", recruiterId: "rec-5", title: "Staff Nurse — ICU", company: "Apollo Care Hospital",
    location: "Delhi", jobProfile: "Mid-Level", industry: "Healthcare", subRole: "Clinical",
    tags: ["Nurse"], workMode: "Office", jobType: "Full-time",
    experienceMin: 2, experienceMax: 6, salaryMin: 4, salaryMax: 6.5, education: "Graduate", openings: 8,
    description: "Provide critical care nursing support in our 24/7 ICU department.",
    criteria: ["BSc Nursing", "ICU experience preferred", "Valid nursing license"],
    contact: { name: "Dr. Priya Nair", email: "hr@apollocare.example", phone: "+919811223344" },
    postedDaysAgo: 3,
  },
  {
    id: "job-7", recruiterId: "rec-6", title: "Credit Analyst", company: "HDFC Capital",
    location: "Mumbai", jobProfile: "Junior", industry: "Finance", subRole: "Banking",
    tags: ["Credit Analyst"], workMode: "Office", jobType: "Full-time",
    experienceMin: 1, experienceMax: 3, salaryMin: 6, salaryMax: 9, education: "Post Graduate",
    description: "Analyze creditworthiness of SME loan applicants and prepare risk assessment reports.",
    criteria: ["MBA Finance or CA Inter", "Strong analytical skills", "Excel & financial modeling"],
    contact: { email: "talent@hdfccapital.example", phone: "+919000112233" },
    postedDaysAgo: 9,
  },
  {
    id: "job-8", recruiterId: "rec-7", title: "Production Engineer", company: "Bharat Manufacturing Ltd.",
    location: "Chennai", jobProfile: "Senior", industry: "Manufacturing", subRole: "Operations",
    tags: ["Production Engineer"], workMode: "Office", jobType: "Full-time",
    experienceMin: 5, experienceMax: 30, education: "Graduate",
    description: "Optimize production lines and implement lean manufacturing practices.",
    criteria: ["B.Tech Mechanical/Industrial", "5+ years in manufacturing", "Six Sigma Green Belt"],
    contact: { name: "Suresh Kumar", phone: "+919334455667" },
    postedDaysAgo: 12,
  },
  {
    id: "job-9", recruiterId: "rec-8", title: "Digital Marketing Intern", company: "GrowthLoop",
    location: "Gurgaon", jobProfile: "Fresher", industry: "Sales & Marketing", subRole: "Marketing",
    tags: ["Digital Marketing", "Social Media"], workMode: "Hybrid", jobType: "Internship",
    experienceMin: 0, experienceMax: 0, salaryMin: 1.8, salaryMax: 2.4, education: "Graduate", openings: 4,
    description: "6-month paid internship running social and performance campaigns for D2C brands.",
    criteria: ["Final-year students or recent graduates", "Good written English", "Basic Canva / Meta Ads"],
    contact: { name: "Neha Kapoor", email: "jobs@growthloop.example", phone: "+919812345670" },
    postedDaysAgo: 1,
  },
  {
    id: "job-10", recruiterId: "rec-9", title: "Delivery Executive", company: "QuickShip Logistics",
    location: "Pune", jobProfile: "Fresher", industry: "Logistics", subRole: "Delivery",
    tags: ["Delivery Executive"], workMode: "Office", jobType: "Part-time",
    experienceMin: 0, experienceMax: 30, salaryMin: 2, salaryMax: 3, education: "10th Pass", openings: 25,
    description: "Flexible delivery shifts across Pune. Two-wheeler and driving licence required.",
    criteria: ["Own two-wheeler", "Valid driving licence", "Android smartphone"],
    contact: { phone: "+919845612378" },
    postedDaysAgo: 0,
  },
  {
    id: "job-11", recruiterId: "rec-10", title: "AWS DevOps Engineer", company: "CloudKraft",
    location: "Noida", jobProfile: "Mid-Level", industry: "IT", subRole: "DevOps & Cloud",
    tags: ["AWS", "Kubernetes", "DevOps Engineer"], workMode: "Remote", jobType: "Full-time",
    experienceMin: 3, experienceMax: 6, salaryMin: 12, salaryMax: 20,
    description: "Own CI/CD, Terraform and EKS for a fast-growing SaaS product.",
    criteria: ["3+ years DevOps", "AWS, Terraform, Kubernetes", "On-call rotation"],
    contact: { name: "Arjun Rao", email: "arjun@cloudkraft.example" },
    postedDaysAgo: 5,
  },
  {
    id: "job-12", recruiterId: "rec-11", title: "International Voice Process", company: "CallServe BPO",
    location: "Kolkata", jobProfile: "Fresher", industry: "Customer Support", subRole: "Voice",
    tags: ["International Voice"], workMode: "Office", jobType: "Full-time",
    experienceMin: 0, experienceMax: 2, salaryMin: 2.8, salaryMax: 4.2, education: "12th Pass", openings: 40,
    description: "US-shift customer support. Cab facility and night-shift allowance.",
    criteria: ["Fluent English", "Comfortable with night shifts", "12th pass or graduate"],
    contact: { name: "HR Desk", phone: "+919830012345", email: "hr@callserve.example" },
    urgent: true,
    postedDaysAgo: 20,
  },
];

export const seedJobs: JobPosting[] = seeds.map(({ postedDaysAgo, ...job }) => ({
  education: "Any",
  openings: 1,
  ...job,
  status: "active",
  createdAt: daysAgo(postedDaysAgo),
  expiresAt: expiresIn(30 - postedDaysAgo),
}));
