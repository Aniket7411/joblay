import { cache } from "react";
import { industryHierarchy, mergeTaxonomy, type Taxonomy } from "@/lib/data/filterHierarchy";
import { listTaxonomyEntries } from "@/lib/repository";

/**
 * Industries → roles → skills: the built-in list plus whatever admins added
 * (Admin → Categories). Falls back to the built-in list if the database
 * can't be read, so search and posting keep working.
 */
let warned = false;

// cache(): pages and metadata in one request share one DB lookup.
export const getTaxonomy = cache(async (): Promise<Taxonomy> => {
  try {
    return mergeTaxonomy(await listTaxonomyEntries());
  } catch (err) {
    // Once per server process, not on every page view.
    if (!warned) {
      warned = true;
      console.error("[taxonomy] using built-in list:", err instanceof Error ? err.message : err);
    }
    return industryHierarchy;
  }
});
