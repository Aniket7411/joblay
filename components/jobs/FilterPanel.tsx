"use client";

import { useId, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  educationLevels,
  getNicheTags,
  getSubRoles,
  industries,
  jobProfiles,
  jobTypes,
  locations,
  postedWithinOptions,
  salaryOptions,
  workModes,
} from "@/lib/data/filterHierarchy";
import type { JobQuery } from "@/lib/jobQuery";
import { cn } from "@/lib/utils";

type ListKey = "location" | "industry" | "subRole" | "tags" | "jobProfile" | "workMode" | "jobType" | "education";

const experienceChoices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20];

/** Every search filter. Each change is applied immediately via `onChange`. */
export function FilterPanel({
  query,
  onChange,
}: {
  query: JobQuery;
  onChange: (next: Partial<JobQuery>) => void;
}) {
  const toggle = (key: ListKey, value: string) => {
    const current = query[key];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    const patch: Partial<JobQuery> = { [key]: next };

    // Keep the industry → sub-role → skill chain consistent.
    if (key === "industry") {
      const roles = new Set(next.flatMap((i) => getSubRoles(i)));
      patch.subRole = query.subRole.filter((r) => roles.has(r));
    }
    if (key === "industry" || key === "subRole") {
      const inds = key === "industry" ? next : query.industry;
      const roles = key === "subRole" ? next : (patch.subRole ?? query.subRole);
      const tags = new Set(inds.flatMap((i) => roles.flatMap((r) => getNicheTags(i, r))));
      patch.tags = query.tags.filter((t) => tags.has(t));
    }
    onChange(patch);
  };

  const subRoleGroups = query.industry
    .map((industry) => ({ industry, roles: getSubRoles(industry) }))
    .filter((g) => g.roles.length);
  const tagGroups = query.industry.flatMap((industry) =>
    query.subRole
      .filter((r) => getSubRoles(industry).includes(r))
      .map((role) => ({ label: role, tags: getNicheTags(industry, role) }))
  );

  return (
    <div className="space-y-1 text-sm">
      <Section title="Work mode" count={query.workMode.length}>
        <ChipGroup options={workModes} selected={query.workMode} onToggle={(v) => toggle("workMode", v)} />
      </Section>

      <Section title="Location" count={query.location.length}>
        <SearchableChecklist
          options={locations}
          selected={query.location}
          onToggle={(v) => toggle("location", v)}
          placeholder="Search city"
        />
      </Section>

      <Section title="Experience" count={query.experience !== undefined ? 1 : 0}>
        <label className="block text-xs text-muted-foreground mb-1.5" htmlFor="f-experience">
          Your experience
        </label>
        <select
          id="f-experience"
          value={query.experience ?? ""}
          onChange={(e) =>
            onChange({ experience: e.target.value === "" ? undefined : Number(e.target.value) })
          }
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-saffron/50"
        >
          <option value="">Any</option>
          {experienceChoices.map((y) => (
            <option key={y} value={y}>
              {y === 0 ? "Fresher (0 years)" : `${y} year${y === 1 ? "" : "s"}`}
            </option>
          ))}
        </select>
      </Section>

      <Section title="Salary" count={query.salary !== undefined ? 1 : 0}>
        <RadioList
          name="salary"
          options={salaryOptions}
          value={query.salary !== undefined ? String(query.salary) : ""}
          onChange={(v) => onChange({ salary: v ? Number(v) : undefined })}
        />
      </Section>

      <Section title="Industry & role" count={query.industry.length + query.subRole.length + query.tags.length}>
        <SearchableChecklist
          options={industries}
          selected={query.industry}
          onToggle={(v) => toggle("industry", v)}
          placeholder="Search industry"
          visible={6}
        />
        {subRoleGroups.map((g) => (
          <div key={g.industry} className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{g.industry} roles</p>
            <ChipGroup options={g.roles} selected={query.subRole} onToggle={(v) => toggle("subRole", v)} />
          </div>
        ))}
        {tagGroups.map((g) => (
          <div key={g.label} className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{g.label} skills</p>
            <ChipGroup options={g.tags} selected={query.tags} onToggle={(v) => toggle("tags", v)} accent="green" />
          </div>
        ))}
      </Section>

      <Section title="Seniority" count={query.jobProfile.length} defaultOpen={false}>
        <ChipGroup options={jobProfiles} selected={query.jobProfile} onToggle={(v) => toggle("jobProfile", v)} />
      </Section>

      <Section title="Job type" count={query.jobType.length} defaultOpen={false}>
        <ChipGroup options={jobTypes} selected={query.jobType} onToggle={(v) => toggle("jobType", v)} />
      </Section>

      <Section title="Education" count={query.education.length} defaultOpen={false}>
        <ChipGroup options={educationLevels} selected={query.education} onToggle={(v) => toggle("education", v)} />
      </Section>

      <Section title="Posted" count={query.postedWithin !== undefined ? 1 : 0} defaultOpen={false}>
        <RadioList
          name="postedWithin"
          options={postedWithinOptions}
          value={query.postedWithin !== undefined ? String(query.postedWithin) : ""}
          onChange={(v) => onChange({ postedWithin: v ? Number(v) : undefined })}
        />
      </Section>

      <Section title="Contact by" count={(query.hasPhone ? 1 : 0) + (query.hasEmail ? 1 : 0)} defaultOpen={false}>
        <Checkbox label="Phone / WhatsApp" checked={query.hasPhone} onChange={(v) => onChange({ hasPhone: v })} />
        <Checkbox label="Email" checked={query.hasEmail} onChange={(v) => onChange({ hasEmail: v })} />
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Section({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen || count > 0);
  return (
    <div className="border-b border-border py-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between font-semibold"
      >
        <span className="flex items-center gap-2">
          {title}
          {count > 0 && (
            <span className="rounded-full bg-saffron px-1.5 text-[11px] leading-5 text-white">{count}</span>
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
  accent = "saffron",
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  accent?: "saffron" | "green";
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(opt)}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
              on
                ? accent === "green"
                  ? "border-india-green bg-india-green text-white"
                  : "border-saffron bg-saffron text-white"
                : "border-border bg-surface text-muted-foreground hover:border-saffron/50 hover:text-foreground"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function SearchableChecklist({
  options,
  selected,
  onToggle,
  placeholder,
  visible = 8,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  placeholder: string;
  visible?: number;
}) {
  const [term, setTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const t = term.trim().toLowerCase();
  // Selected first, then the rest in list order.
  const ordered = [...selected.filter((s) => options.includes(s)), ...options.filter((o) => !selected.includes(o))];
  const matches = ordered.filter((o) => !t || o.toLowerCase().includes(t));
  const shown = t || showAll ? matches : matches.slice(0, Math.max(visible, selected.length));

  return (
    <div>
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-lg border border-border bg-surface py-1.5 pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50"
        />
      </div>
      <div className="space-y-0.5">
        {shown.map((opt) => (
          <Checkbox key={opt} label={opt} checked={selected.includes(opt)} onChange={() => onToggle(opt)} />
        ))}
        {matches.length === 0 && <p className="text-xs text-muted-foreground py-1">No matches</p>}
      </div>
      {!t && matches.length > shown.length && (
        <button type="button" onClick={() => setShowAll(true)} className="mt-1 text-xs font-medium text-saffron-dark dark:text-saffron hover:underline">
          Show all {matches.length}
        </button>
      )}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/60">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border accent-[var(--saffron)]"
      />
      <span className={cn(checked && "font-medium text-foreground")}>{label}</span>
    </label>
  );
}

function RadioList({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  // Unique per instance: the sidebar and mobile drawer can both be mounted.
  const group = `${name}-${useId()}`;
  return (
    <div className="space-y-0.5">
      {[{ value: "", label: "Any" }, ...options].map((o) => (
        <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/60">
          <input
            type="radio"
            name={group}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="h-4 w-4 accent-[var(--saffron)]"
          />
          <span className={cn(value === o.value && o.value && "font-medium text-foreground")}>{o.label}</span>
        </label>
      ))}
    </div>
  );
}
