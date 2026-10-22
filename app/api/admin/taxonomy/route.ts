import { z } from "zod";
import { fail, ok, serverError, validationFailed } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/auth/current";
import { createTaxonomyEntry, isDuplicateError } from "@/lib/repository";
import { getTaxonomy } from "@/lib/taxonomy";

// Commas separate values in search URLs (?industry=IT,Finance), so names can't contain them.
const name = (label: string) =>
  z
    .string()
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(60, `${label} must be 60 characters or fewer`)
    .refine((v) => !/[,<>]/.test(v), `${label} can't contain commas or < >`)
    .transform((v) => v.replace(/\s+/g, " "));

const bodySchema = z
  .object({
    industry: name("Industry"),
    subRole: name("Role").optional(),
    tag: name("Skill").optional(),
  })
  .refine((b) => !b.tag || b.subRole, { message: "Choose a role for the skill", path: ["subRole"] });

/** Case-insensitive lookup returning the stored spelling. */
const find = (names: string[], value: string) =>
  names.find((n) => n.toLowerCase() === value.toLowerCase());

/** Adds an industry, a role under an industry, or a skill under a role. */
export async function POST(request: Request) {
  try {
    if (!(await getCurrentAdmin())) return fail("Admins only", 403);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);
    const { industry, subRole, tag } = parsed.data;

    const taxonomy = await getTaxonomy();
    const existingIndustry = find(Object.keys(taxonomy), industry);

    if (!subRole) {
      if (existingIndustry) return fail(`"${existingIndustry}" already exists`, 409);
      const entry = await createTaxonomyEntry({ industry });
      return ok(`Industry "${industry}" added`, entry, { status: 201 });
    }

    if (!existingIndustry) return fail(`Industry "${industry}" doesn't exist`, 400);
    const roles = taxonomy[existingIndustry];
    const existingRole = find(Object.keys(roles), subRole);

    if (!tag) {
      if (existingRole) return fail(`"${existingRole}" already exists in ${existingIndustry}`, 409);
      const entry = await createTaxonomyEntry({ industry: existingIndustry, subRole });
      return ok(`Role "${subRole}" added to ${existingIndustry}`, entry, { status: 201 });
    }

    if (!existingRole) return fail(`Role "${subRole}" doesn't exist in ${existingIndustry}`, 400);
    const existingTag = find(roles[existingRole], tag);
    if (existingTag) return fail(`"${existingTag}" already exists in ${existingRole}`, 409);
    const entry = await createTaxonomyEntry({ industry: existingIndustry, subRole: existingRole, tag });
    return ok(`Skill "${tag}" added to ${existingRole}`, entry, { status: 201 });
  } catch (err) {
    if (isDuplicateError(err)) return fail("That already exists", 409);
    return serverError(err, "admin/taxonomy:POST");
  }
}
