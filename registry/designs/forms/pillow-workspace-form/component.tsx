"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, KeyboardEvent, MouseEvent, RefObject } from "react";
import { ArrowRight, Check, ChevronDown, CircleAlert, Globe, Lock } from "lucide-react";

export type PillowTeamSize = {
  value: string;
  /** Short label set in large numerals, such as "2–10". */
  label: string;
  /** What screen readers say instead, such as "2 to 10 people". */
  spoken: string;
};

export type PillowRole = { value: string; label: string; hint: string };

export type PillowTimeZone = {
  /** IANA zone name, such as "Europe/Lisbon". Its UTC offset is computed for today's date. */
  value: string;
  city: string;
  region: string;
  /** Extra words that should find this zone, such as nearby cities. */
  keywords?: string;
};

export type PillowWorkspaceValues = {
  name: string;
  teamSize: string;
  role: string;
  timeZone: string;
  inviteByEmail: boolean;
};

/** What onSubmit receives: the values plus the URL built from the name. */
export type PillowWorkspaceSubmission = PillowWorkspaceValues & { slug: string; url: string };

export type PillowWorkspaceErrors = Partial<Record<"name" | "role" | "timeZone" | "form", string>>;

export type PillowWorkspaceStatus = "idle" | "loading" | "error" | "success";

export type PillowWorkspaceFormProps = {
  title?: string;
  description?: string;
  /** The host shown in the live URL preview. */
  domain?: string;
  submitLabel?: string;
  teamSizes?: PillowTeamSize[];
  roles?: PillowRole[];
  timeZones?: PillowTimeZone[];
  defaultValues?: Partial<PillowWorkspaceValues>;
  /** Errors to show on first render, for example from a server round trip. */
  errors?: PillowWorkspaceErrors;
  /** Status on first render. After that the form manages it from onSubmit. */
  status?: PillowWorkspaceStatus;
  disabled?: boolean;
  /** Why the form is disabled, shown above the fields. */
  disabledReason?: string;
  /** Focuses the workspace name when the form mounts. */
  autoFocus?: boolean;
  /**
   * Called with valid values. Resolve to finish with the success check, resolve with field errors to show them,
   * or throw to show the error's message under the button.
   */
  onSubmit?: (
    values: PillowWorkspaceSubmission,
  ) => void | PillowWorkspaceErrors | Promise<void | PillowWorkspaceErrors>;
  className?: string;
};

const DEFAULT_TEAM_SIZES: PillowTeamSize[] = [
  { value: "1", label: "1", spoken: "Just me" },
  { value: "2-10", label: "2–10", spoken: "2 to 10 people" },
  { value: "11-50", label: "11–50", spoken: "11 to 50 people" },
  { value: "51-200", label: "51–200", spoken: "51 to 200 people" },
  { value: "201+", label: "200+", spoken: "More than 200 people" },
];

const DEFAULT_ROLES: PillowRole[] = [
  { value: "engineering", label: "Engineering", hint: "Code, infrastructure and reviews" },
  { value: "design", label: "Design", hint: "Product, brand and research" },
  { value: "product", label: "Product", hint: "Roadmaps, specs and launches" },
  { value: "operations", label: "Operations", hint: "People, finance and support" },
  { value: "leadership", label: "Leadership", hint: "Founders and department heads" },
  { value: "other", label: "Something else", hint: "We’ll keep your templates general" },
];

const DEFAULT_TIME_ZONES: PillowTimeZone[] = [
  { value: "Pacific/Honolulu", city: "Honolulu", region: "United States", keywords: "Hawaii" },
  {
    value: "America/Los_Angeles",
    city: "Los Angeles",
    region: "United States",
    keywords: "San Francisco Seattle Pacific",
  },
  { value: "America/Denver", city: "Denver", region: "United States", keywords: "Mountain" },
  { value: "America/Mexico_City", city: "Mexico City", region: "Mexico" },
  { value: "America/Chicago", city: "Chicago", region: "United States", keywords: "Austin Central" },
  { value: "America/New_York", city: "New York", region: "United States", keywords: "Boston Miami Eastern" },
  { value: "America/Toronto", city: "Toronto", region: "Canada", keywords: "Montreal" },
  { value: "America/Bogota", city: "Bogotá", region: "Colombia", keywords: "Lima" },
  { value: "America/Sao_Paulo", city: "São Paulo", region: "Brazil", keywords: "Rio de Janeiro" },
  { value: "America/Argentina/Buenos_Aires", city: "Buenos Aires", region: "Argentina" },
  { value: "Atlantic/Reykjavik", city: "Reykjavík", region: "Iceland" },
  { value: "Europe/Lisbon", city: "Lisbon", region: "Portugal", keywords: "Porto" },
  { value: "Europe/London", city: "London", region: "United Kingdom", keywords: "Dublin Edinburgh" },
  { value: "Africa/Lagos", city: "Lagos", region: "Nigeria" },
  { value: "Europe/Madrid", city: "Madrid", region: "Spain", keywords: "Barcelona" },
  { value: "Europe/Paris", city: "Paris", region: "France" },
  { value: "Europe/Berlin", city: "Berlin", region: "Germany", keywords: "Munich Amsterdam" },
  { value: "Europe/Stockholm", city: "Stockholm", region: "Sweden", keywords: "Oslo Copenhagen" },
  { value: "Europe/Warsaw", city: "Warsaw", region: "Poland", keywords: "Prague" },
  { value: "Africa/Johannesburg", city: "Johannesburg", region: "South Africa", keywords: "Cape Town" },
  { value: "Europe/Athens", city: "Athens", region: "Greece", keywords: "Helsinki" },
  { value: "Africa/Nairobi", city: "Nairobi", region: "Kenya" },
  { value: "Europe/Istanbul", city: "Istanbul", region: "Türkiye" },
  { value: "Asia/Dubai", city: "Dubai", region: "United Arab Emirates", keywords: "Abu Dhabi" },
  { value: "Asia/Karachi", city: "Karachi", region: "Pakistan" },
  { value: "Asia/Kolkata", city: "Bengaluru", region: "India", keywords: "Kolkata Mumbai Delhi Chennai" },
  { value: "Asia/Dhaka", city: "Dhaka", region: "Bangladesh" },
  { value: "Asia/Bangkok", city: "Bangkok", region: "Thailand", keywords: "Hanoi" },
  { value: "Asia/Jakarta", city: "Jakarta", region: "Indonesia" },
  { value: "Asia/Singapore", city: "Singapore", region: "Singapore", keywords: "Kuala Lumpur" },
  { value: "Asia/Manila", city: "Manila", region: "Philippines" },
  { value: "Asia/Shanghai", city: "Shanghai", region: "China", keywords: "Beijing Shenzhen" },
  { value: "Asia/Seoul", city: "Seoul", region: "South Korea" },
  { value: "Asia/Tokyo", city: "Tokyo", region: "Japan", keywords: "Osaka" },
  { value: "Australia/Sydney", city: "Sydney", region: "Australia", keywords: "Melbourne" },
  { value: "Pacific/Auckland", city: "Auckland", region: "New Zealand", keywords: "Wellington" },
];

const MESSAGES = {
  nameEmpty: "Give your workspace a name.",
  nameShort: "Use at least 3 letters or numbers.",
  role: "Choose the role closest to yours.",
  timeZone: "Choose your team’s time zone.",
  timeZonePick: "Pick a time zone from the list.",
  form: "We couldn’t create the workspace. Try again in a moment.",
};

/* The pillow material, defined once for both modes: wells, lifted fields, the 3:1 control line, the soft focus ring,
   layered shadows and two springs (stiffness 380 / damping 30, and 400 / 25) sampled into CSS linear() curves. */
const MATERIAL = [
  "[--pw-line:color-mix(in_oklab,var(--iu-foreground)_50%,transparent)]",
  "[--pw-well:color-mix(in_oklab,var(--iu-accent)_4%,color-mix(in_oklab,var(--iu-foreground)_2.5%,var(--iu-surface)))]",
  "[--pw-well-hover:color-mix(in_oklab,var(--iu-accent)_7%,color-mix(in_oklab,var(--iu-foreground)_3.5%,var(--iu-surface)))]",
  "[--pw-lifted:var(--iu-surface)]",
  "[--pw-tint:color-mix(in_oklab,var(--iu-accent)_10%,var(--iu-surface))]",
  "[--pw-focus:color-mix(in_oklab,var(--iu-accent)_82%,var(--iu-foreground))]",
  "[--pw-halo:color-mix(in_oklab,var(--iu-accent)_22%,transparent)]",
  "[--pw-edge:color-mix(in_oklab,var(--iu-foreground)_80%,var(--iu-accent))]",
  "[--pw-sh-card:0_1px_1px_color-mix(in_oklab,black_4%,transparent),0_6px_12px_-4px_color-mix(in_oklab,black_5%,transparent),0_32px_64px_-24px_color-mix(in_oklab,black_18%,transparent)]",
  "[--pw-sh-well:inset_0_1px_3px_color-mix(in_oklab,black_9%,transparent),0_0_0_0_transparent,0_0_0_0_transparent]",
  "[--pw-sh-lift:inset_0_0_0_0_transparent,0_1px_2px_color-mix(in_oklab,black_6%,transparent),0_12px_24px_-12px_color-mix(in_oklab,black_24%,transparent)]",
  "[--pw-sh-thumb:0_1px_2px_color-mix(in_oklab,black_8%,transparent),0_4px_10px_-3px_color-mix(in_oklab,black_14%,transparent)]",
  "[--pw-sh-knob:0_1px_2px_color-mix(in_oklab,black_20%,transparent),0_2px_6px_-1px_color-mix(in_oklab,black_16%,transparent)]",
  "[--pw-sh-pop:0_2px_4px_color-mix(in_oklab,black_4%,transparent),0_18px_40px_-12px_color-mix(in_oklab,black_24%,transparent)]",
  "[--pw-sh-btn:inset_0_1px_0_color-mix(in_oklab,white_30%,transparent),inset_0_-2px_0_color-mix(in_oklab,black_10%,transparent),0_1px_2px_color-mix(in_oklab,black_12%,transparent),0_10px_20px_-10px_color-mix(in_oklab,var(--iu-accent)_70%,transparent)]",
  "[--pw-sh-btn-hover:inset_0_1px_0_color-mix(in_oklab,white_30%,transparent),inset_0_-2px_0_color-mix(in_oklab,black_10%,transparent),0_2px_4px_color-mix(in_oklab,black_12%,transparent),0_14px_26px_-10px_color-mix(in_oklab,var(--iu-accent)_70%,transparent)]",
  "[--pw-sh-pressed:inset_0_2px_5px_color-mix(in_oklab,black_30%,transparent),inset_0_1px_1px_color-mix(in_oklab,black_18%,transparent),0_0_0_0_transparent,0_0_0_0_transparent]",
  "[--pw-spring:linear(0,0.078_5.6%,0.247_11.1%,0.438_16.7%,0.614_22.2%,0.757_27.8%,0.863_33.3%,0.936_38.9%,0.982_44.4%,1.007_50%,1.019_55.6%,1.023_61.1%,1.017_72.2%,1.009_83.3%,1)]",
  "[--pw-pop:linear(0,0.085_4.5%,0.275_9.1%,0.495_13.6%,0.698_18.2%,0.859_22.7%,0.973_27.3%,1.041_31.8%,1.081_40.9%,1.056_50%,1.022_59.1%,1.001_68.2%,0.994_77.3%,0.996_90.9%,1)]",
  "dark:[--pw-line:color-mix(in_oklab,var(--iu-foreground)_40%,transparent)]",
  "dark:[--pw-well:color-mix(in_oklab,var(--iu-accent)_3%,color-mix(in_oklab,var(--iu-background)_60%,var(--iu-surface)))]",
  "dark:[--pw-well-hover:color-mix(in_oklab,var(--iu-accent)_5%,color-mix(in_oklab,var(--iu-background)_40%,var(--iu-surface)))]",
  "dark:[--pw-lifted:color-mix(in_oklab,var(--iu-foreground)_6%,var(--iu-surface))]",
  "dark:[--pw-tint:color-mix(in_oklab,var(--iu-accent)_16%,var(--iu-surface))]",
  "dark:[--pw-focus:color-mix(in_oklab,var(--iu-accent)_88%,var(--iu-foreground))]",
  "dark:[--pw-halo:color-mix(in_oklab,var(--iu-accent)_30%,transparent)]",
  "dark:[--pw-sh-card:inset_0_1px_0_color-mix(in_oklab,white_5%,transparent),0_24px_48px_-16px_color-mix(in_oklab,black_70%,transparent)]",
  "dark:[--pw-sh-well:inset_0_1px_2px_color-mix(in_oklab,black_45%,transparent),0_0_0_0_transparent,0_0_0_0_transparent]",
  "dark:[--pw-sh-lift:inset_0_0_0_0_transparent,0_1px_2px_color-mix(in_oklab,black_40%,transparent),0_12px_28px_-12px_color-mix(in_oklab,black_80%,transparent)]",
  "dark:[--pw-sh-thumb:inset_0_1px_0_color-mix(in_oklab,white_8%,transparent),0_1px_2px_color-mix(in_oklab,black_40%,transparent),0_4px_10px_-3px_color-mix(in_oklab,black_50%,transparent)]",
  "dark:[--pw-sh-knob:0_1px_2px_color-mix(in_oklab,black_50%,transparent),0_2px_6px_-1px_color-mix(in_oklab,black_40%,transparent)]",
  "dark:[--pw-sh-pop:0_2px_4px_color-mix(in_oklab,black_30%,transparent),0_24px_48px_-12px_color-mix(in_oklab,black_75%,transparent)]",
  "dark:[--pw-sh-btn:inset_0_1px_0_color-mix(in_oklab,white_26%,transparent),inset_0_-2px_0_color-mix(in_oklab,black_14%,transparent),0_1px_2px_color-mix(in_oklab,black_40%,transparent),0_10px_20px_-10px_color-mix(in_oklab,var(--iu-accent)_35%,transparent)]",
  "dark:[--pw-sh-btn-hover:inset_0_1px_0_color-mix(in_oklab,white_26%,transparent),inset_0_-2px_0_color-mix(in_oklab,black_14%,transparent),0_2px_4px_color-mix(in_oklab,black_40%,transparent),0_14px_26px_-10px_color-mix(in_oklab,var(--iu-accent)_40%,transparent)]",
  "dark:[--pw-sh-pressed:inset_0_2px_6px_color-mix(in_oklab,black_45%,transparent),inset_0_1px_1px_color-mix(in_oklab,black_30%,transparent),0_0_0_0_transparent,0_0_0_0_transparent]",
].join(" ");

const LABEL = "mb-2 block w-fit text-sm/5 font-medium text-(--iu-foreground)";
const HELPER =
  "mt-2 text-[13px]/[18px] text-pretty text-(--iu-muted) transition-opacity duration-150 group-data-[open]/field:opacity-0 motion-reduce:transition-none";
const ERROR =
  "mt-2 flex items-start gap-1.5 text-[13px]/[18px] font-medium text-red-700 transition-opacity duration-150 group-data-[open]/field:opacity-0 motion-reduce:transition-none dark:text-red-400";

/* A well that lifts out to meet focus: 1px up, a soft drop shadow, a deep edge that keeps 3:1 and a soft accent ring. */
const FIELD_BOX = [
  "relative flex min-h-[max(40px,calc(48px*var(--iu-density)))] w-full items-center",
  "rounded-[max(var(--iu-radius),14px)] border border-(--pw-line) bg-(--pw-well) shadow-(--pw-sh-well)",
  "transition-[translate,background-color,border-color,box-shadow] duration-300 ease-(--pw-spring) motion-reduce:transition-none",
  "focus-within:-translate-y-px focus-within:border-(--pw-edge) focus-within:bg-(--pw-lifted) focus-within:shadow-(--pw-sh-lift) focus-within:ring-4 focus-within:ring-(--pw-halo)",
  "group-data-[invalid]/field:border-red-600 group-data-[invalid]/field:focus-within:border-red-600 group-data-[invalid]/field:focus-within:ring-red-600/15 dark:group-data-[invalid]/field:border-red-400 dark:group-data-[invalid]/field:focus-within:border-red-400 dark:group-data-[invalid]/field:focus-within:ring-red-400/20",
  "group-data-[disabled]/pw:border-(--iu-foreground)/15 group-data-[disabled]/pw:bg-(--iu-foreground)/[0.04] group-data-[disabled]/pw:shadow-none",
  "pointer-fine:hover:not-focus-within:not-disabled:not-has-disabled:bg-(--pw-well-hover)",
].join(" ");

const POPUP = [
  "absolute inset-x-0 top-full z-30 mt-2 origin-top rounded-[max(var(--iu-radius),16px)] border border-(--iu-border) bg-(--iu-surface) p-1.5 shadow-(--pw-sh-pop)",
  "transition-[opacity,scale] duration-150 ease-out starting:scale-[0.98] starting:opacity-0 motion-reduce:transition-none",
  "dark:border-(--iu-foreground)/12 dark:bg-(--pw-lifted)",
].join(" ");

const OPTION =
  "flex cursor-pointer items-center gap-3 rounded-[max(calc(var(--iu-radius)-2px),10px)] px-3 py-2.5 select-none data-[active]:bg-(--pw-tint)";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function fold(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(name: string) {
  return fold(name)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toUpperCase();
}

const offsets = new Map<string, string>();

/** Today's UTC offset of an IANA zone, such as "UTC+1" or "UTC−4", so daylight saving is always right. */
function utcOffset(timeZone: string) {
  const known = offsets.get(timeZone);
  if (known !== undefined) return known;
  let label = "";
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
      .formatToParts(new Date())
      .find((item) => item.type === "timeZoneName")?.value;
    if (part) label = part === "GMT" ? "UTC+0" : part.replace("GMT", "UTC").replace("-", "\u2212");
  } catch {
    label = "";
  }
  offsets.set(timeZone, label);
  return label;
}

function searchZones(zones: PillowTimeZone[], query: string) {
  const needle = fold(query.trim());
  if (!needle) return zones;
  const hits = zones.filter((zone) => {
    const offset = utcOffset(zone.value);
    return fold(
      `${zone.city} ${zone.region} ${zone.value} ${zone.keywords ?? ""} ${offset} ${offset.replace("\u2212", "-")}`,
    )
      .replace(/_/g, " ")
      .includes(needle);
  });
  // Best matches first: the city starts with the query, then a word of the city, then a word of the region.
  const rank = (zone: PillowTimeZone) => {
    const city = fold(zone.city);
    if (city.startsWith(needle)) return 0;
    if (city.split(/[\s-]+/).some((word) => word.startsWith(needle))) return 1;
    return fold(`${zone.region} ${zone.keywords ?? ""}`)
      .split(/[\s-]+/)
      .some((word) => word.startsWith(needle))
      ? 2
      : 3;
  };
  return [...hits].sort((a, b) => rank(a) - rank(b));
}

function findExactZone(zones: PillowTimeZone[], query: string) {
  const needle = fold(query.trim());
  if (!needle) return undefined;
  return zones.find((zone) => fold(zone.city) === needle || fold(`${zone.city}, ${zone.region}`) === needle);
}

type FieldName = "name" | "role" | "timeZone";

function validate(values: PillowWorkspaceValues, timeZoneQuery: string): PillowWorkspaceErrors {
  const errors: PillowWorkspaceErrors = {};
  if (!values.name.trim()) errors.name = MESSAGES.nameEmpty;
  else if (slugify(values.name).replace(/-/g, "").length < 3) errors.name = MESSAGES.nameShort;
  if (!values.role) errors.role = MESSAGES.role;
  if (!values.timeZone) errors.timeZone = timeZoneQuery.trim() ? MESSAGES.timeZonePick : MESSAGES.timeZone;
  return errors;
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className={ERROR}>
      <CircleAlert size={14} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0" />
      {message}
    </p>
  );
}

/** Scrolls the list just enough to keep the highlighted option visible, without moving the page. */
function useActiveOptionInView(listRef: RefObject<HTMLUListElement | null>, open: boolean, active: number) {
  useEffect(() => {
    const list = listRef.current;
    const item = open && active >= 0 ? list?.children[active] : null;
    if (!list || !(item instanceof HTMLElement)) return;
    if (item.offsetTop < list.scrollTop) list.scrollTop = item.offsetTop - 6;
    else if (item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = item.offsetTop + item.offsetHeight - list.clientHeight + 6;
    }
  }, [listRef, open, active]);
}

function isPrintable(event: KeyboardEvent) {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

/* Select-only combobox (WAI-ARIA APG): focus stays on the trigger and aria-activedescendant moves through the
   listbox. Arrows, Home, End, PageUp, PageDown, Enter, Space, Escape, Tab and type-ahead all work. */
function RoleSelect({
  id,
  options,
  value,
  onChange,
  error,
  helper,
  locked,
  triggerRef,
}: {
  id: string;
  options: PillowRole[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helper: string;
  locked: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const search = useRef({ text: "", time: 0 });
  const listRef = useRef<HTMLUListElement>(null);
  const labelId = `${id}-label`;
  const listboxId = `${id}-listbox`;
  const describedBy = error ? `${id}-error` : `${id}-help`;
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];
  const optionId = (index: number) => `${id}-option-${index}`;

  useActiveOptionInView(listRef, open, active);

  function show(index: number) {
    setOpen(true);
    setActive(index);
  }

  function commit(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  }

  function typeahead(char: string, time: number, from: number) {
    const buffer = search.current;
    buffer.text = time - buffer.time > 600 ? char : buffer.text + char;
    buffer.time = time;
    const text = buffer.text.toLowerCase();
    const repeated = text.split("").every((letter) => letter === text[0]);
    const needle = repeated ? text.slice(0, 1) : text;
    const start = repeated ? from + 1 : from;
    for (let step = 0; step < options.length; step += 1) {
      const index = (start + step) % options.length;
      if (options[index]?.label.toLowerCase().startsWith(needle)) return index;
    }
    return -1;
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (locked || options.length === 0) return;
    const last = options.length - 1;
    const current = active >= 0 ? active : Math.max(selectedIndex, 0);
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " ", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        show(event.key === "Home" ? 0 : event.key === "End" ? last : Math.max(selectedIndex, 0));
      } else if (isPrintable(event)) {
        event.preventDefault();
        const match = typeahead(event.key, event.timeStamp, Math.max(selectedIndex, 0));
        show(match >= 0 ? match : Math.max(selectedIndex, 0));
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive(Math.min(current + 1, last));
        break;
      case "ArrowUp":
        event.preventDefault();
        if (event.altKey) commit(current);
        else setActive(Math.max(current - 1, 0));
        break;
      case "Home":
      case "PageUp":
        event.preventDefault();
        setActive(event.key === "Home" ? 0 : Math.max(current - 10, 0));
        break;
      case "End":
      case "PageDown":
        event.preventDefault();
        setActive(event.key === "End" ? last : Math.min(current + 10, last));
        break;
      case "Enter":
        event.preventDefault();
        commit(current);
        break;
      case " ":
        event.preventDefault();
        if (event.timeStamp - search.current.time < 600 && search.current.text) {
          const match = typeahead(" ", event.timeStamp, current);
          if (match >= 0) setActive(match);
        } else commit(current);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        break;
      case "Tab":
        commit(current);
        break;
      default:
        if (isPrintable(event)) {
          event.preventDefault();
          const match = typeahead(event.key, event.timeStamp, current);
          if (match >= 0) setActive(match);
        }
    }
  }

  return (
    <div className="group/field" data-invalid={error ? "" : undefined} data-open={open ? "" : undefined}>
      <span id={labelId} className={LABEL} onClick={() => triggerRef.current?.focus()}>
        Your role
      </span>
      <div className="relative">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="combobox"
          aria-labelledby={labelId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required="true"
          disabled={locked}
          onClick={() => (open ? setOpen(false) : show(Math.max(selectedIndex, 0)))}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
          className={cx(FIELD_BOX, "cursor-pointer gap-3 px-4 text-left outline-none disabled:cursor-not-allowed")}
        >
          <span
            data-placeholder={selected ? undefined : ""}
            className="min-w-0 flex-1 truncate text-base font-medium text-(--iu-foreground) group-data-[disabled]/pw:text-(--iu-muted) data-[placeholder]:text-(--iu-muted)"
          >
            {selected ? selected.label : "Choose your role"}
          </span>
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            aria-hidden="true"
            className="shrink-0 text-(--iu-muted) transition-transform duration-200 ease-(--pw-spring) group-data-[open]/field:rotate-180 motion-reduce:transition-none"
          />
        </button>
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          hidden={!open}
          onMouseDown={(event) => event.preventDefault()}
          className={cx(POPUP, "max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain")}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={option.value === value}
              data-active={index === active ? "" : undefined}
              onPointerMove={() => setActive(index)}
              onClick={() => commit(index)}
              className={OPTION}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px]/5 font-medium text-(--iu-foreground)">{option.label}</span>
                <span className="mt-0.5 block truncate text-[13px]/[18px] text-(--iu-muted)">{option.hint}</span>
              </span>
              {option.value === value ? (
                <Check size={16} strokeWidth={2} aria-hidden="true" className="shrink-0 text-(--iu-accent)" />
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      {error ? (
        <FieldError id={`${id}-error`} message={error} />
      ) : (
        <p id={`${id}-help`} className={HELPER}>
          {helper}
        </p>
      )}
    </div>
  );
}

/* Editable combobox with list autocomplete (WAI-ARIA APG): typing filters, the first match is highlighted,
   Enter picks it, Escape closes the list (or clears the text when it is already closed). */
function TimeZoneCombobox({
  id,
  zones,
  value,
  query,
  onQueryChange,
  onChange,
  onUnmatched,
  error,
  helper,
  locked,
  inputRef,
}: {
  id: string;
  zones: PillowTimeZone[];
  value: string;
  query: string;
  onQueryChange: (query: string) => void;
  onChange: (zone: PillowTimeZone) => void;
  onUnmatched: (query: string) => void;
  error?: string;
  helper: string;
  locked: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [typed, setTyped] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = `${id}-listbox`;
  const describedBy = error ? `${id}-error` : `${id}-help`;
  const selected = zones.find((zone) => zone.value === value);
  const matches = useMemo(
    () => searchZones(zones, selected && query === selected.city ? "" : query),
    [zones, selected, query],
  );
  const selectedIndex = matches.findIndex((zone) => zone.value === value);
  const optionId = (zone: PillowTimeZone) => `${id}-option-${zone.value.replace(/[^a-zA-Z0-9]/g, "-")}`;
  const activeZone = open ? matches[active] : undefined;

  useActiveOptionInView(listRef, open, active);

  function show(index: number) {
    setOpen(true);
    setActive(index);
  }

  function commit(zone: PillowTimeZone) {
    onChange(zone);
    setTyped(false);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (locked) return;
    const last = matches.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) show(event.altKey ? -1 : Math.max(selectedIndex, 0));
        else if (last >= 0) setActive(active >= last ? 0 : active + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (event.altKey) setOpen(false);
        else if (!open) show(selectedIndex >= 0 ? selectedIndex : last);
        else if (last >= 0) setActive(active <= 0 ? last : active - 1);
        break;
      case "Enter":
        if (activeZone) {
          event.preventDefault();
          commit(activeZone);
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        } else if (query) {
          event.preventDefault();
          setTyped(true);
          onQueryChange("");
        }
        break;
      case "Tab":
        if (activeZone && typed) commit(activeZone);
        break;
    }
  }

  function onBlur() {
    setOpen(false);
    if (!typed) return;
    setTyped(false);
    const exact = findExactZone(zones, query);
    if (exact) onChange(exact);
    else if (query.trim()) onUnmatched(query.trim());
  }

  const noMatch = open && matches.length === 0;

  return (
    <div className="group/field" data-invalid={error ? "" : undefined} data-open={open ? "" : undefined}>
      <label htmlFor={id} className={LABEL}>
        Time zone
      </label>
      <div className="relative">
        <div className={FIELD_BOX}>
          <Globe
            size={16}
            strokeWidth={1.5}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 text-(--iu-muted)"
          />
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={activeZone ? optionId(activeZone) : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-required="true"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Search a city or offset"
            value={query}
            disabled={locked}
            onChange={(event) => {
              setTyped(true);
              onQueryChange(event.target.value);
              show(0);
            }}
            onClick={() => {
              if (!open && !locked) show(Math.max(selectedIndex, 0));
            }}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            className="min-w-0 flex-1 self-stretch bg-transparent pl-11 text-base font-medium text-(--iu-foreground) outline-none group-data-[disabled]/pw:text-(--iu-muted) placeholder:text-(--iu-muted) disabled:cursor-not-allowed"
          />
          {selected && query === selected.city ? (
            <span className="shrink-0 text-sm font-medium text-(--iu-muted) tabular-nums">
              {utcOffset(selected.value)}
            </span>
          ) : null}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Show time zones"
            aria-expanded={open}
            aria-controls={listboxId}
            disabled={locked}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              inputRef.current?.focus();
              if (open) setOpen(false);
              else show(Math.max(selectedIndex, 0));
            }}
            className="mr-1 ml-1 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-(--iu-muted) disabled:cursor-not-allowed"
          >
            <ChevronDown
              size={16}
              strokeWidth={1.5}
              aria-hidden="true"
              className="transition-transform duration-200 ease-(--pw-spring) group-data-[open]/field:rotate-180 motion-reduce:transition-none"
            />
          </button>
        </div>
        <div hidden={!open} onMouseDown={(event) => event.preventDefault()} className={POPUP}>
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Time zones"
            hidden={matches.length === 0}
            className="relative max-h-[min(17.5rem,50vh)] overflow-y-auto overscroll-contain"
          >
            {matches.map((zone, index) => (
              <li
                key={zone.value}
                id={optionId(zone)}
                role="option"
                aria-selected={zone.value === value}
                data-active={index === active ? "" : undefined}
                onPointerMove={() => setActive(index)}
                onClick={() => commit(zone)}
                className={OPTION}
              >
                <span className="min-w-0 flex-1 truncate">
                  <span className="text-[15px]/5 font-medium text-(--iu-foreground)">{zone.city}</span>
                  <span className="ml-2 text-[13px] text-(--iu-muted)">{zone.region}</span>
                </span>
                <span className="shrink-0 text-[13px] text-(--iu-muted) tabular-nums">{utcOffset(zone.value)}</span>
                <Check
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                  className={cx("shrink-0 text-(--iu-accent)", zone.value !== value && "invisible")}
                />
              </li>
            ))}
          </ul>
          {noMatch ? (
            <p className="px-3 py-5 text-center text-sm/5 text-pretty text-(--iu-muted)">
              <span className="block font-medium text-(--iu-foreground)">No time zone matches “{query.trim()}”</span>
              Try a city, a country or an offset such as UTC+2.
            </p>
          ) : null}
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {open && typed ? (matches.length ? `${matches.length} time zones found` : "No time zone matches") : ""}
      </span>
      {error ? (
        <FieldError id={`${id}-error`} message={error} />
      ) : (
        <p id={`${id}-help`} className={HELPER}>
          {helper}
        </p>
      )}
    </div>
  );
}

export function PillowWorkspaceForm({
  title = "Create your workspace",
  description = "A shared home for your team’s projects, docs and decisions. You can change any of this later.",
  domain = "wrenhouse.app",
  submitLabel = "Create workspace",
  teamSizes = DEFAULT_TEAM_SIZES,
  roles = DEFAULT_ROLES,
  timeZones = DEFAULT_TIME_ZONES,
  defaultValues = {},
  errors: initialErrors = {},
  status: initialStatus = "idle",
  disabled = false,
  disabledReason,
  autoFocus = false,
  onSubmit,
  className = "",
}: PillowWorkspaceFormProps) {
  const uid = useId();
  const id = (part: string) => `${uid}-${part}`;
  const [name, setName] = useState(defaultValues.name ?? "");
  const [teamSize, setTeamSize] = useState(defaultValues.teamSize ?? teamSizes[1]?.value ?? teamSizes[0]?.value ?? "");
  const [role, setRole] = useState(defaultValues.role ?? "");
  const [timeZone, setTimeZone] = useState(defaultValues.timeZone ?? "");
  const [timeZoneQuery, setTimeZoneQuery] = useState(
    () => timeZones.find((zone) => zone.value === defaultValues.timeZone)?.city ?? "",
  );
  const [inviteByEmail, setInviteByEmail] = useState(defaultValues.inviteByEmail ?? true);
  const [errors, setErrors] = useState<PillowWorkspaceErrors>(initialErrors);
  const [status, setStatus] = useState<PillowWorkspaceStatus>(initialStatus);
  const [announcement, setAnnouncement] = useState("");
  const [focusRequest, setFocusRequest] = useState<{ field: FieldName } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLButtonElement>(null);
  const timeZoneRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const busy = status === "loading" || status === "success";
  const locked = disabled || busy;
  const slug = slugify(name);
  const url = `${domain}/${slug || "your-workspace"}`;
  const workspaceName = name.trim() || "your workspace";
  const sizeIndex = Math.max(
    teamSizes.findIndex((size) => size.value === teamSize),
    0,
  );
  const monogram = initials(name);

  useEffect(() => {
    if (autoFocus) nameRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  useEffect(() => {
    if (!focusRequest) return;
    const target = { name: nameRef, role: roleRef, timeZone: timeZoneRef }[focusRequest.field];
    target.current?.focus();
  }, [focusRequest]);

  // The progress ring is an honest indicator: it only spins while the request runs and pauses offscreen.
  useEffect(() => {
    const root = rootRef.current;
    if (status !== "loading" || !root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) root.toggleAttribute("data-offscreen", !entry.isIntersecting);
    });
    observer.observe(root);
    return () => {
      observer.disconnect();
      root.removeAttribute("data-offscreen");
    };
  }, [status]);

  function setFieldError(field: keyof PillowWorkspaceErrors, message: string | undefined) {
    setErrors((current) => {
      if (current[field] === message) return current;
      const next = { ...current };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  }

  function showErrors(next: PillowWorkspaceErrors) {
    setErrors(next);
    setStatus("error");
    const fields = (["name", "role", "timeZone"] as const).filter((field) => next[field]);
    if (fields[0]) setFocusRequest({ field: fields[0] });
    setAnnouncement(
      next.form ??
        (fields.length === 1 ? "One field needs your attention." : `${fields.length} fields need your attention.`),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    const values: PillowWorkspaceValues = { name: name.trim(), teamSize, role, timeZone, inviteByEmail };
    const found = validate(values, timeZoneQuery);
    if (Object.keys(found).length > 0) {
      showErrors(found);
      return;
    }
    submitRef.current?.focus({ preventScroll: true });
    setErrors({});
    setStatus("loading");
    setAnnouncement(`Creating ${values.name}.`);
    try {
      const result = await onSubmit?.({ ...values, slug, url: `${domain}/${slug}` });
      if (typeof result === "object" && result !== null && Object.keys(result).length > 0) {
        showErrors(result);
        return;
      }
      setStatus("success");
      setAnnouncement(`${values.name} is ready at ${domain}/${slug}.`);
    } catch (error) {
      showErrors({ form: error instanceof Error && error.message ? error.message : MESSAGES.form });
    }
  }

  function onSwitchTileClick(event: MouseEvent<HTMLDivElement>) {
    if (locked || (event.target as HTMLElement).closest("label, button")) return;
    setInviteByEmail((value) => !value);
  }

  const nameDescribedBy = errors.name ? id("name-error") : id("name-help");

  return (
    <div
      ref={rootRef}
      data-status={status}
      data-disabled={disabled ? "" : undefined}
      className={cx(
        "group/pw @container w-full font-(family-name:--iu-font) text-(--iu-foreground)",
        MATERIAL,
        className,
      )}
    >
      <form
        noValidate
        aria-labelledby={id("title")}
        aria-describedby={id("description")}
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-[480px] rounded-[max(calc(var(--iu-radius)+14px),24px)] border border-(--iu-border) bg-(--iu-surface) p-[calc(20px*var(--iu-density))] shadow-(--pw-sh-card) @sm:p-[calc(32px*var(--iu-density))] dark:border-(--iu-foreground)/10"
      >
        <h2
          id={id("title")}
          className="text-[26px]/[1.15] font-semibold tracking-[-0.025em] text-balance @sm:text-[28px]/[1.1]"
        >
          {title}
        </h2>
        <p id={id("description")} className="mt-2 text-[15px]/[1.55] text-pretty text-(--iu-muted)">
          {description}
        </p>

        {disabled && disabledReason ? (
          <div className="mt-6 flex gap-3 rounded-[max(var(--iu-radius),14px)] border border-(--iu-border) bg-(--pw-well) p-4 text-sm/5 text-pretty text-(--iu-foreground)">
            <Lock size={16} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-(--iu-muted)" />
            <p>{disabledReason}</p>
          </div>
        ) : null}

        <div className="mt-[calc(28px*var(--iu-density))] flex flex-col gap-[calc(24px*var(--iu-density))]">
          <div className="group/field" data-invalid={errors.name ? "" : undefined}>
            <label htmlFor={id("name")} className={LABEL}>
              Workspace name
            </label>
            <div className={FIELD_BOX}>
              <span
                aria-hidden="true"
                data-empty={monogram ? undefined : ""}
                className="pointer-events-none absolute left-2.5 grid size-8 place-items-center rounded-[max(calc(var(--iu-radius)-2px),10px)] border border-(--iu-accent)/30 bg-(--pw-tint) text-[12px] font-semibold tracking-[0.02em] text-(--iu-foreground) transition-colors duration-200 group-data-[disabled]/pw:border-(--iu-foreground)/15 group-data-[disabled]/pw:bg-transparent group-data-[disabled]/pw:text-(--iu-muted) data-[empty]:border-dashed data-[empty]:border-(--iu-foreground)/25 data-[empty]:bg-transparent motion-reduce:transition-none"
              >
                {monogram}
              </span>
              <input
                ref={nameRef}
                id={id("name")}
                type="text"
                autoComplete="organization"
                maxLength={48}
                placeholder="e.g. Juniper Labs"
                value={name}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={nameDescribedBy}
                aria-required="true"
                disabled={locked}
                onChange={(event) => {
                  setName(event.target.value);
                  if (errors.name) {
                    setFieldError(
                      "name",
                      validate({ name: event.target.value, teamSize, role, timeZone, inviteByEmail }, timeZoneQuery)
                        .name,
                    );
                  }
                }}
                onBlur={() => {
                  if (name.trim()) {
                    setFieldError("name", validate({ name, teamSize, role, timeZone, inviteByEmail }, "").name);
                  }
                }}
                className="w-full self-stretch bg-transparent pr-4 pl-[52px] text-base font-medium text-(--iu-foreground) outline-none group-data-[disabled]/pw:text-(--iu-muted) placeholder:text-(--iu-muted) disabled:cursor-not-allowed"
              />
            </div>
            {errors.name ? (
              <FieldError id={id("name-error")} message={errors.name} />
            ) : (
              <p id={id("name-help")} className="mt-2 flex min-w-0">
                <span className="sr-only">Workspace URL: </span>
                <span className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border border-(--iu-border) bg-(--pw-well) py-1 pr-3 pl-2.5 text-[13px]/[18px] text-(--iu-muted)">
                  <Lock size={12} strokeWidth={2} aria-hidden="true" className="shrink-0" />
                  <span className="truncate">
                    {domain}/
                    <span
                      data-placeholder={slug ? undefined : ""}
                      className="font-medium text-(--iu-foreground) data-[placeholder]:text-(--iu-muted)"
                    >
                      {slug || "your-workspace"}
                    </span>
                  </span>
                </span>
              </p>
            )}
          </div>

          <fieldset className="min-w-0" disabled={locked} aria-describedby={id("size-help")}>
            <legend className={LABEL}>Team size</legend>
            <div
              style={{ "--pw-count": teamSizes.length } as CSSProperties}
              className="relative grid grid-cols-[repeat(var(--pw-count),minmax(0,1fr))] rounded-full border border-(--pw-line) bg-(--pw-well) p-1 shadow-(--pw-sh-well) group-data-[disabled]/pw:border-(--iu-foreground)/15 group-data-[disabled]/pw:shadow-none"
            >
              <span
                aria-hidden="true"
                style={{ transform: `translateX(${sizeIndex * 100}%)` }}
                className="pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-8px)/var(--pw-count))] rounded-full border border-(--pw-line) bg-(--iu-surface) shadow-(--pw-sh-thumb) transition-transform duration-[410ms] ease-(--pw-spring) group-data-[disabled]/pw:border-(--iu-foreground)/15 group-data-[disabled]/pw:shadow-none motion-reduce:transition-none dark:bg-[color-mix(in_oklab,var(--iu-foreground)_12%,var(--iu-surface))]"
              />
              {teamSizes.map((size) => (
                <label
                  key={size.value}
                  className="relative flex h-10 cursor-pointer items-center justify-center rounded-full text-sm font-semibold tracking-[-0.01em] text-(--iu-muted) tabular-nums transition-[color,scale] duration-200 active:scale-[0.97] has-checked:text-(--iu-foreground) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--pw-focus) has-disabled:cursor-not-allowed has-disabled:active:scale-100 motion-reduce:transition-none @sm:text-[15px] pointer-fine:hover:not-has-disabled:text-(--iu-foreground)"
                >
                  <input
                    type="radio"
                    name={id("size")}
                    value={size.value}
                    checked={teamSize === size.value}
                    onChange={() => setTeamSize(size.value)}
                    className="sr-only"
                  />
                  <span aria-hidden="true">{size.label}</span>
                  <span className="sr-only">{size.spoken}</span>
                </label>
              ))}
            </div>
            <p id={id("size-help")} className={HELPER}>
              We’ll suggest a plan that fits. Only active members are billed.
            </p>
          </fieldset>

          <RoleSelect
            id={id("role")}
            options={roles}
            value={role}
            onChange={(value) => {
              setRole(value);
              setFieldError("role", undefined);
            }}
            error={errors.role}
            helper="We’ll set up starter templates that fit how you work."
            locked={locked}
            triggerRef={roleRef}
          />

          <TimeZoneCombobox
            id={id("tz")}
            zones={timeZones}
            value={timeZone}
            query={timeZoneQuery}
            onQueryChange={(query) => {
              setTimeZoneQuery(query);
              setTimeZone("");
              setFieldError("timeZone", undefined);
            }}
            onChange={(zone) => {
              setTimeZone(zone.value);
              setTimeZoneQuery(zone.city);
              setFieldError("timeZone", undefined);
            }}
            onUnmatched={() => setFieldError("timeZone", MESSAGES.timeZonePick)}
            error={errors.timeZone}
            helper="Due dates, reminders and digests follow this zone."
            locked={locked}
            inputRef={timeZoneRef}
          />

          <div
            onClick={onSwitchTileClick}
            className="flex cursor-pointer items-start gap-4 rounded-[max(var(--iu-radius),14px)] border border-(--iu-border) bg-(--pw-well) p-4 transition-colors duration-200 group-data-[disabled]/pw:cursor-not-allowed motion-reduce:transition-none dark:border-(--iu-foreground)/10 pointer-fine:hover:not-has-disabled:bg-(--pw-well-hover)"
          >
            <div className="min-w-0 flex-1">
              <label htmlFor={id("invite")} className="block w-fit cursor-pointer text-sm/5 font-medium">
                Invite teammates by email
              </label>
              <p id={id("invite-help")} className="mt-1 text-[13px]/[18px] text-pretty text-(--iu-muted)">
                We’ll ask for their addresses on the next step.
              </p>
            </div>
            <button
              id={id("invite")}
              type="button"
              role="switch"
              aria-checked={inviteByEmail}
              aria-describedby={id("invite-help")}
              disabled={locked}
              onClick={() => setInviteByEmail((value) => !value)}
              className="group/switch relative mt-0.5 inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-(--pw-line) bg-(--pw-well) shadow-(--pw-sh-well) transition-[background-color,border-color] duration-200 outline-none group-data-[disabled]/pw:border-(--iu-foreground)/15 group-data-[disabled]/pw:bg-(--iu-foreground)/15 group-data-[disabled]/pw:shadow-none before:absolute before:-inset-2 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--pw-focus) disabled:cursor-not-allowed aria-checked:border-(--pw-focus) aria-checked:bg-(--iu-accent) group-data-[disabled]/pw:aria-checked:border-(--iu-foreground)/15 group-data-[disabled]/pw:aria-checked:bg-(--iu-foreground)/25 motion-reduce:transition-none"
            >
              <span
                aria-hidden="true"
                className="absolute top-1/2 left-[5px] size-4 -translate-y-1/2 rounded-full bg-(--pw-line) transition-[translate,width,height,background-color] duration-[410ms] ease-(--pw-spring) group-aria-checked/switch:size-5 group-aria-checked/switch:translate-x-[18px] group-aria-checked/switch:bg-(--iu-surface) group-aria-checked/switch:shadow-(--pw-sh-knob) motion-reduce:transition-none dark:group-aria-checked/switch:bg-(--iu-foreground)"
              />
            </button>
          </div>
        </div>

        <div className="mt-[calc(32px*var(--iu-density))]">
          <div className="relative flex h-12 items-center">
            <button
              ref={submitRef}
              type="submit"
              disabled={disabled}
              aria-disabled={disabled || busy ? true : undefined}
              aria-busy={status === "loading" ? true : undefined}
              aria-label={
                status === "loading" ? "Creating workspace" : status === "success" ? "Workspace created" : undefined
              }
              aria-describedby={errors.form ? id("form-error") : undefined}
              className="relative isolate inline-flex h-12 w-full shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-(--iu-accent) text-[15px] font-semibold text-(--iu-accent-foreground) shadow-(--pw-sh-btn) transition-[width,translate,scale,box-shadow,background-color] duration-[380ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] outline-none group-data-[status=loading]/pw:w-12 group-data-[status=loading]/pw:scale-[0.96] group-data-[status=loading]/pw:shadow-(--pw-sh-pressed) group-data-[status=success]/pw:w-12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--pw-focus) active:not-aria-disabled:scale-[0.98] active:not-aria-disabled:shadow-(--pw-sh-pressed) disabled:cursor-not-allowed disabled:bg-(--iu-foreground)/8 disabled:text-(--iu-muted) disabled:shadow-none aria-disabled:cursor-default motion-reduce:transition-none dark:bg-[color-mix(in_oklab,var(--iu-accent)_90%,var(--iu-background))] dark:disabled:bg-(--iu-foreground)/10 pointer-fine:hover:not-active:not-aria-disabled:-translate-y-px pointer-fine:hover:not-active:not-aria-disabled:shadow-(--pw-sh-btn-hover)"
            >
              <span className="flex items-center gap-2 px-6 whitespace-nowrap transition-opacity duration-150 ease-out group-data-[status=loading]/pw:opacity-0 group-data-[status=success]/pw:opacity-0 motion-reduce:transition-none">
                {submitLabel}
                <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span
                aria-hidden="true"
                className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-data-[status=loading]/pw:opacity-100 group-data-[status=loading]/pw:delay-200 group-data-[status=success]/pw:delay-150 motion-reduce:transition-none"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-6 group-data-[offscreen]/pw:[animation-play-state:paused]! group-data-[status=loading]/pw:motion-safe:animate-spin"
                >
                  <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="2.25" className="opacity-25" />
                  <circle
                    cx="12"
                    cy="12"
                    r="9.25"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    pathLength={100}
                    transform="rotate(-90 12 12)"
                    className="transition-[stroke-dasharray] duration-200 ease-out [stroke-dasharray:28_100] group-data-[status=success]/pw:[stroke-dasharray:100_100] motion-reduce:transition-none"
                  />
                </svg>
              </span>
              <span
                aria-hidden="true"
                className="absolute inset-0 grid scale-50 place-items-center opacity-0 transition-[opacity,scale] duration-500 ease-(--pw-pop) group-data-[status=success]/pw:scale-100 group-data-[status=success]/pw:opacity-100 group-data-[status=success]/pw:delay-150 motion-reduce:transition-none"
              >
                <svg viewBox="0 0 24 24" fill="none" className="size-6">
                  <path
                    d="M20 6 9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    className="transition-[stroke-dashoffset] delay-[180ms] duration-300 ease-out [stroke-dasharray:1] [stroke-dashoffset:1] group-data-[status=success]/pw:[stroke-dashoffset:0] motion-reduce:transition-none"
                  />
                </svg>
              </span>
            </button>
            <div
              aria-hidden="true"
              className="pointer-events-none invisible absolute inset-y-0 right-0 left-16 flex min-w-0 -translate-x-1 flex-col justify-center opacity-0 transition-[opacity,translate,visibility] duration-300 ease-out group-data-[status=loading]/pw:visible group-data-[status=loading]/pw:translate-x-0 group-data-[status=loading]/pw:opacity-100 group-data-[status=loading]/pw:delay-[220ms] group-data-[status=success]/pw:visible group-data-[status=success]/pw:translate-x-0 group-data-[status=success]/pw:opacity-100 motion-reduce:transition-none"
            >
              <p className="truncate text-[15px]/5 font-semibold text-(--iu-foreground)">
                {status === "success" ? `${workspaceName} is ready` : `Creating ${workspaceName}…`}
              </p>
              <p className="mt-0.5 truncate text-[13px]/[18px] text-(--iu-muted)">
                {status === "success" ? `Live at ${url}` : `Reserving ${url}`}
              </p>
            </div>
          </div>
          {errors.form ? (
            <p
              id={id("form-error")}
              className="mt-3 flex items-start gap-1.5 text-[13px]/[18px] font-medium text-red-700 dark:text-red-400"
            >
              <CircleAlert size={14} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0" />
              {errors.form}
            </p>
          ) : null}
        </div>
        <p role="status" className="sr-only">
          {announcement}
        </p>
      </form>
    </div>
  );
}

export default PillowWorkspaceForm;
