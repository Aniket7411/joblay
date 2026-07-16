"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Filter, RotateCcw, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getNicheTags,
  getSubRoles,
  industries,
  jobProfiles,
  locations,
} from "@/lib/data/filterHierarchy";
import type { JobFilters } from "@/types";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  filters: JobFilters;
  onChange: (filters: JobFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const subRoles = getSubRoles(filters.industry);
  const nicheTags = getNicheTags(filters.industry, filters.subRole);

  const update = (partial: Partial<JobFilters>) => {
    const next = { ...filters, ...partial };
    if (partial.industry !== undefined && partial.industry !== filters.industry) {
      next.subRole = "";
      next.tags = [];
    }
    if (partial.subRole !== undefined && partial.subRole !== filters.subRole) {
      next.tags = [];
    }
    onChange(next);
  };

  const toggleTag = (tag: string) => {
    const tags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    update({ tags });
  };

  const clearAll = () =>
    onChange({
      location: "",
      jobProfile: "",
      industry: "",
      subRole: "",
      tags: [],
      search: filters.search,
    });

  const activeCount = [
    filters.location,
    filters.jobProfile,
    filters.industry,
    filters.subRole,
    ...filters.tags,
  ].filter(Boolean).length;

  return (
    <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search roles, companies, tags..."
            className="w-full rounded-xl border border-border bg-surface pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50 focus:border-saffron transition-colors"
            aria-label="Search jobs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mr-1">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </span>

          <FilterSelect
            label="Location"
            value={filters.location}
            options={locations}
            onChange={(v) => update({ location: v })}
          />
          <FilterSelect
            label="Job Profile"
            value={filters.jobProfile}
            options={jobProfiles}
            onChange={(v) => update({ jobProfile: v })}
          />
          <FilterSelect
            label="Industry"
            value={filters.industry}
            options={industries}
            onChange={(v) => update({ industry: v })}
          />

          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <RotateCcw className="h-3.5 w-3.5" />
              Clear ({activeCount})
            </Button>
          )}
        </div>

        <AnimatePresence>
          {filters.industry && subRoles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {filters.industry} subfilters
              </p>
              <div className="flex flex-wrap gap-2">
                {subRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() =>
                      update({
                        subRole: filters.subRole === role ? "" : role,
                      })
                    }
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      filters.subRole === role
                        ? "bg-saffron text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {filters.subRole && nicheTags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Select niche tags (multi-select)
              </p>
              <div className="flex flex-wrap gap-2">
                {nicheTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                      filters.tags.includes(tag)
                        ? "bg-india-green text-white border-india-green"
                        : "bg-surface text-muted-foreground border-border hover:border-saffron/40"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filters.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {filters.tags.map((tag) => (
              <Badge key={tag} variant="green" className="gap-1 pr-1">
                {tag}
                <button
                  onClick={() => toggleTag(tag)}
                  className="ml-0.5 hover:opacity-70"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={cn(
        "rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-saffron/50 focus:border-saffron",
        value && "border-saffron/50 bg-saffron/5 font-medium"
      )}
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
