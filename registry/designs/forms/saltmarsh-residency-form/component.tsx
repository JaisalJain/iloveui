"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown, CircleAlert, LoaderCircle } from "lucide-react";

export type SaltmarshValues = {
  name: string;
  email: string;
  discipline: string;
  hometown: string;
  season: string;
  title: string;
  statement: string;
};

export type SaltmarshField = keyof SaltmarshValues;
export type SaltmarshErrors = Partial<Record<SaltmarshField, string>>;
export type SaltmarshOption = { value: string; label: string; phrase: string };
export type SaltmarshSeason = { value: string; label: string; months: string };

export type SaltmarshResidencyFormProps = {
  residency?: string;
  season?: string;
  headline?: string;
  intro?: string;
  disciplines?: SaltmarshOption[];
  cities?: string[];
  seasons?: SaltmarshSeason[];
  defaultValues?: Partial<SaltmarshValues>;
  /** Errors to show immediately, for example from a server response. */
  errors?: SaltmarshErrors;
  status?: "idle" | "loading" | "success";
  disabled?: boolean;
  disabledReason?: string;
  autoFocus?: boolean;
  today?: string;
  /** Short date printed on the postmark after sending. */
  postmark?: string;
  decisionDate?: string;
  onSubmit?: (values: SaltmarshValues) => Promise<void> | void;
  className?: string;
};

const DEFAULT_DISCIPLINES: SaltmarshOption[] = [
  { value: "fiction", label: "Fiction", phrase: "fiction" },
  { value: "nonfiction", label: "Nonfiction", phrase: "nonfiction" },
  { value: "poetry", label: "Poetry", phrase: "poetry" },
  { value: "translation", label: "Literary translation", phrase: "literary translation" },
  { value: "screen", label: "Screenwriting", phrase: "screenwriting" },
  { value: "graphic", label: "Graphic narrative", phrase: "graphic narrative" },
];

const DEFAULT_CITIES = [
  "Accra, Ghana",
  "Asheville, United States",
  "Bergen, Norway",
  "Busan, South Korea",
  "Duluth, United States",
  "Galway, Ireland",
  "Halifax, Canada",
  "Hobart, Australia",
  "Kraków, Poland",
  "Kyoto, Japan",
  "Lagos, Nigeria",
  "Leeds, United Kingdom",
  "Ljubljana, Slovenia",
  "Marseille, France",
  "Medellín, Colombia",
  "Montréal, Canada",
  "Nairobi, Kenya",
  "Oaxaca, Mexico",
  "Porto, Portugal",
  "Pune, India",
  "Tallinn, Estonia",
  "Tbilisi, Georgia",
  "Trieste, Italy",
  "Valparaíso, Chile",
];

const DEFAULT_SEASONS: SaltmarshSeason[] = [
  { value: "spring", label: "Spring", months: "March to May" },
  { value: "summer", label: "Summer", months: "June to August" },
  { value: "autumn", label: "Autumn", months: "September to November" },
];

const EMPTY: SaltmarshValues = {
  name: "",
  email: "",
  discipline: "",
  hometown: "",
  season: "",
  title: "",
  statement: "",
};

const ORDER: SaltmarshField[] = ["name", "email", "discipline", "hometown", "season", "title", "statement"];
const MIN_WORDS = 50;
const MAX_WORDS = 300;

const KICKER = "text-[11px] font-medium tracking-[0.16em] uppercase";
const FIELD =
  "h-11 w-full rounded-none border-0 border-b bg-transparent px-0 text-base text-(--iu-foreground) transition-[border-color,box-shadow] duration-300 outline-none placeholder:text-(--iu-muted) focus:border-(--iu-accent) focus:shadow-[inset_0_-1px_0_var(--iu-accent)] disabled:cursor-not-allowed disabled:border-dashed disabled:text-(--iu-muted) motion-reduce:transition-none";
const FIELD_OK =
  "border-(--iu-foreground)/55 pointer-fine:hover:border-(--iu-foreground) disabled:pointer-fine:hover:border-(--iu-foreground)/55";
const FIELD_BAD = "border-rose-700 dark:border-rose-400";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function fold(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function wordCount(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function validate(values: SaltmarshValues, cities: string[]): SaltmarshErrors {
  const errors: SaltmarshErrors = {};
  if (!values.name.trim()) errors.name = "Tell us your name as you would sign a letter.";
  if (!values.email.trim()) errors.email = "Add an email so we can reply.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()))
    errors.email = "That email looks incomplete, for example noor@kettle.page.";
  if (!values.discipline) errors.discipline = "Choose the form you will work in.";
  if (!values.hometown.trim()) errors.hometown = "Choose where you are writing from.";
  else if (!cities.includes(values.hometown)) errors.hometown = "Pick a city from the list, or the nearest one to you.";
  if (!values.season) errors.season = "Choose a season.";
  if (!values.title.trim()) errors.title = "Give the project a working title.";
  const words = wordCount(values.statement);
  if (words < MIN_WORDS)
    errors.statement = words
      ? `Write at least ${MIN_WORDS} words; you have ${words}.`
      : "Tell us about the project in a few sentences.";
  else if (words > MAX_WORDS) errors.statement = `Keep it under ${MAX_WORDS} words; you have ${words}.`;
  return errors;
}

function Message({ id, error, children }: { id: string; error?: string; children: ReactNode }) {
  return (
    <p
      id={id}
      className={cx(
        "mt-2 flex items-start gap-2 text-sm leading-snug text-pretty",
        error ? "text-rose-700 dark:text-rose-300" : "text-(--iu-muted)",
      )}
    >
      {error ? <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" className="mt-px shrink-0" /> : null}
      <span>{error ?? children}</span>
    </p>
  );
}

function Label({ htmlFor, id, children }: { htmlFor?: string; id?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} id={id} className={cx("block text-(--iu-foreground)", KICKER)}>
      {children}
    </label>
  );
}

export function SaltmarshResidencyForm({
  residency = "Saltmarsh Writers' Residency",
  season: seasonYear = "2027 season",
  headline = "A quiet month by the water, to finish the thing.",
  intro = "Six writers a season live in the old pilot cottages at Saltmarsh Point. Room, board and a stipend of $2,400 are covered. Tell us who you are and what you are working on.",
  disciplines = DEFAULT_DISCIPLINES,
  cities = DEFAULT_CITIES,
  seasons = DEFAULT_SEASONS,
  defaultValues,
  errors: forcedErrors,
  status: forcedStatus,
  disabled = false,
  disabledReason = "Applications for 2027 closed on 1 October 2026. The 2028 season opens on 1 June 2027.",
  autoFocus = false,
  today = "27 October 2026",
  postmark = "27 X 2026",
  decisionDate = "15 January 2027",
  onSubmit,
  className = "",
}: SaltmarshResidencyFormProps) {
  const uid = `sm${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const id = (name: string) => `${uid}-${name}`;
  const [values, setValues] = useState<SaltmarshValues>({ ...EMPTY, ...defaultValues });
  const [errors, setErrors] = useState<SaltmarshErrors>(forcedErrors ?? {});
  const [internalStatus, setInternalStatus] = useState<"idle" | "loading" | "success">("idle");
  const [focused, setFocused] = useState<SaltmarshField | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const status = forcedStatus ?? internalStatus;
  const locked = disabled || status !== "idle";

  // Select-only combobox state (discipline)
  const [selectOpen, setSelectOpen] = useState(false);
  const [selectActive, setSelectActive] = useState(-1);
  const typed = useRef({ text: "", time: 0 });
  // Editable combobox state (hometown)
  const [cityOpen, setCityOpen] = useState(false);
  const [cityActive, setCityActive] = useState(-1);
  const [cityQuery, setCityQuery] = useState(values.hometown);

  useEffect(() => {
    if (autoFocus) nameRef.current?.focus();
  }, [autoFocus]);

  // A chosen city shows the whole list again, so the reader can change it.
  const matches =
    cityQuery.trim() && !cities.includes(cityQuery)
      ? cities.filter(
          (city) =>
            fold(city)
              .split(/[\s,]+/)
              .some((word) => word.startsWith(fold(cityQuery.trim()))) || fold(city).startsWith(fold(cityQuery.trim())),
        )
      : cities;

  const set = <K extends SaltmarshField>(field: K, value: SaltmarshValues[K]) => {
    const next = { ...values, [field]: value };
    setValues(next);
    // Early to reward: an error clears as soon as the value is fixed.
    if (errors[field] && !validate(next, cities)[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const blur = (field: SaltmarshField) => {
    setFocused(null);
    const value = values[field];
    // Late to punish: only text that is there gets checked on blur; empty fields wait for submit.
    if (value.trim()) setErrors((current) => ({ ...current, [field]: validate(values, cities)[field] }));
  };

  const describedBy = (field: SaltmarshField) => id(`${field}-msg`);
  const invalid = (field: SaltmarshField) => Boolean(errors[field]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked) return;
    const found = validate(values, cities);
    setErrors(found);
    const bad = ORDER.filter((field) => found[field]);
    if (bad.length) {
      setAnnouncement(`${bad.length} ${bad.length === 1 ? "field needs" : "fields need"} attention.`);
      const first = bad[0];
      const target =
        first === "discipline"
          ? document.getElementById(id("discipline"))
          : first === "season"
            ? document.querySelector<HTMLInputElement>(`input[name="${id("season")}"]`)
            : document.getElementById(id(first ?? "name"));
      target?.focus();
      return;
    }
    setInternalStatus("loading");
    setAnnouncement("Sending your application.");
    try {
      await onSubmit?.(values);
      setInternalStatus("success");
      setAnnouncement(`Application received. We reply by ${decisionDate}.`);
    } catch {
      setInternalStatus("idle");
      setAnnouncement("Sending failed. Check your connection and try again.");
    }
  };

  // ---- discipline: select-only combobox ----
  const selectedIndex = disciplines.findIndex((option) => option.value === values.discipline);
  const openSelect = (at: number) => {
    setSelectOpen(true);
    setSelectActive(at);
  };
  const choose = (index: number) => {
    const option = disciplines[index];
    if (option) set("discipline", option.value);
    setSelectOpen(false);
  };
  const onSelectKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = disciplines.length - 1;
    const key = event.key;
    if (!selectOpen) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(key)) {
        event.preventDefault();
        openSelect(key === "ArrowUp" ? Math.max(selectedIndex, 0) : selectedIndex >= 0 ? selectedIndex : 0);
      } else if (key === "Home" || key === "End") {
        event.preventDefault();
        openSelect(key === "Home" ? 0 : last);
      } else if (key.length === 1 && /\S/.test(key)) {
        openSelect(typeahead(key, event.timeStamp, selectedIndex));
      }
      return;
    }
    if (key === "ArrowDown") setSelectActive((current) => Math.min(last, current + 1));
    else if (key === "ArrowUp") {
      if (event.altKey) choose(selectActive);
      else setSelectActive((current) => Math.max(0, current - 1));
    } else if (key === "Home") setSelectActive(0);
    else if (key === "End") setSelectActive(last);
    else if (key === "Enter" || key === " ") choose(selectActive);
    else if (key === "Escape") setSelectOpen(false);
    else if (key === "Tab") {
      choose(selectActive);
      return;
    } else if (key.length === 1 && /\S/.test(key)) {
      setSelectActive(typeahead(key, event.timeStamp, selectActive));
      return;
    } else return;
    event.preventDefault();
  };
  function typeahead(char: string, time: number, from: number) {
    const state = typed.current;
    state.text = time - state.time > 600 ? char.toLowerCase() : state.text + char.toLowerCase();
    state.time = time;
    const repeated = state.text.split("").every((letter) => letter === state.text[0]);
    const needle = repeated ? state.text[0]! : state.text;
    const start = repeated ? from + 1 : from;
    for (let step = 0; step < disciplines.length; step++) {
      const index = (start + step + disciplines.length) % disciplines.length;
      if (disciplines[index]!.label.toLowerCase().startsWith(needle)) return index;
    }
    return Math.max(from, 0);
  }

  // ---- hometown: editable combobox with list autocomplete ----
  const pickCity = (city: string) => {
    setCityQuery(city);
    set("hometown", city);
    setCityOpen(false);
    setCityActive(-1);
  };
  const onCityKey = (event: KeyboardEvent<HTMLInputElement>) => {
    const last = matches.length - 1;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!cityOpen) setCityOpen(true);
      setCityActive((current) => (current >= last ? 0 : current + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!cityOpen) setCityOpen(true);
      setCityActive((current) => (current <= 0 ? last : current - 1));
    } else if (event.key === "Enter") {
      if (cityOpen && cityActive >= 0 && matches[cityActive]) {
        event.preventDefault();
        pickCity(matches[cityActive]!);
      }
    } else if (event.key === "Escape") {
      if (cityOpen) setCityOpen(false);
      else {
        setCityQuery("");
        set("hometown", "");
      }
    } else if (event.key === "Tab" && cityOpen && cityActive >= 0 && matches[cityActive]) {
      pickCity(matches[cityActive]!);
    }
  };

  const discipline = disciplines.find((option) => option.value === values.discipline);
  const seasonChoice = seasons.find((option) => option.value === values.season);
  const words = wordCount(values.statement);
  const opening = values.statement.trim().split(/(?<=[.!?])\s/)[0] ?? "";

  // The letter: each clause belongs to one field, and the clause being edited is underlined.
  const clause = (field: SaltmarshField, text: string | undefined, blankWidth = "w-24") =>
    text ? (
      <span
        className={cx(
          "underline decoration-1 underline-offset-[6px] transition-[text-decoration-color] duration-300 motion-reduce:transition-none",
          focused === field ? "decoration-(--iu-accent)" : "decoration-transparent",
        )}
      >
        {text}
      </span>
    ) : (
      <span className="whitespace-nowrap">
        <span
          aria-hidden="true"
          className={cx(
            "inline-block h-[0.9em] translate-y-[0.15em] border-b transition-colors duration-300 motion-reduce:transition-none",
            blankWidth,
            focused === field ? "border-(--iu-accent)" : "border-dashed border-(--iu-foreground)/35",
          )}
        />
        <span className="sr-only">(not filled in yet)</span>
      </span>
    );

  const sectionTitle = (numeral: string, title: string) => (
    <legend className="flex w-full items-baseline gap-4 border-b border-(--iu-foreground) pb-3">
      <span className="font-serif text-2xl text-(--iu-muted) italic">{numeral}</span>
      <span className="font-serif text-2xl leading-none">{title}</span>
    </legend>
  );

  return (
    <section
      data-saltmarsh-form
      aria-labelledby={id("heading")}
      className={cx(
        "@container mx-auto w-full max-w-[1120px] rounded-[min(var(--iu-radius),2px)] border border-(--iu-border) bg-(--iu-surface) font-(family-name:--iu-font) text-(--iu-foreground) dark:border-(--iu-foreground)/15",
        className,
      )}
    >
      <header className="border-b-[3px] border-double border-(--iu-foreground) px-[calc(20px*var(--iu-density))] pt-8 pb-8 @2xl:px-[calc(48px*var(--iu-density))] @2xl:pt-12">
        <p className={cx("flex flex-wrap justify-between gap-2 text-(--iu-muted)", KICKER)}>
          <span>{residency}</span>
          <span className="tabular-nums">Application · {seasonYear}</span>
        </p>
        <h2
          id={id("heading")}
          className="mt-6 max-w-[18ch] font-serif text-[40px] leading-[1.02] tracking-[-0.01em] text-balance @2xl:text-[64px]"
        >
          {headline}
        </h2>
        <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-pretty text-(--iu-muted)">{intro}</p>
      </header>

      {disabled ? (
        <p
          className="mx-[calc(20px*var(--iu-density))] mt-8 flex items-start gap-3 border-l-2 border-(--iu-accent) pl-4 text-sm leading-relaxed text-pretty @2xl:mx-[calc(48px*var(--iu-density))]"
          id={id("closed")}
        >
          {disabledReason}
        </p>
      ) : null}

      <div className="grid gap-12 px-[calc(20px*var(--iu-density))] py-10 @2xl:px-[calc(48px*var(--iu-density))] @4xl:grid-cols-12 @4xl:gap-0">
        <form
          noValidate
          onSubmit={submit}
          aria-describedby={disabled ? id("closed") : undefined}
          className="flex flex-col gap-12 @4xl:col-span-7 @4xl:pr-12"
        >
          <fieldset disabled={locked} className="m-0 min-w-0 border-0 p-0">
            {sectionTitle("i.", "About you")}
            <div className="mt-6 flex flex-col gap-8">
              <div className="grid gap-8 @xl:grid-cols-2 @xl:gap-6">
                <div>
                  <Label htmlFor={id("name")}>Full name</Label>
                  <input
                    ref={nameRef}
                    id={id("name")}
                    name="name"
                    autoComplete="name"
                    value={values.name}
                    onChange={(event) => set("name", event.target.value)}
                    onFocus={() => setFocused("name")}
                    onBlur={() => blur("name")}
                    aria-invalid={invalid("name") || undefined}
                    aria-describedby={describedBy("name")}
                    className={cx(FIELD, invalid("name") ? FIELD_BAD : FIELD_OK, "mt-2")}
                  />
                  <Message id={describedBy("name")} error={errors.name}>
                    As you sign your work.
                  </Message>
                </div>
                <div>
                  <Label htmlFor={id("email")}>Email</Label>
                  <input
                    id={id("email")}
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={values.email}
                    onChange={(event) => set("email", event.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => blur("email")}
                    aria-invalid={invalid("email") || undefined}
                    aria-describedby={describedBy("email")}
                    className={cx(FIELD, invalid("email") ? FIELD_BAD : FIELD_OK, "mt-2")}
                  />
                  <Message id={describedBy("email")} error={errors.email}>
                    Only for news about your application.
                  </Message>
                </div>
              </div>

              <div className="grid gap-8 @xl:grid-cols-2 @xl:gap-6">
                {/* Discipline: WAI-ARIA select-only combobox */}
                <div className="relative">
                  <Label id={id("discipline-label")} htmlFor={id("discipline")}>
                    Discipline
                  </Label>
                  <button
                    type="button"
                    id={id("discipline")}
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-expanded={selectOpen}
                    aria-controls={id("discipline-list")}
                    aria-labelledby={`${id("discipline-label")} ${id("discipline")}`}
                    aria-activedescendant={
                      selectOpen && selectActive >= 0 ? id(`discipline-${selectActive}`) : undefined
                    }
                    aria-invalid={invalid("discipline") || undefined}
                    aria-describedby={describedBy("discipline")}
                    onClick={() => (selectOpen ? setSelectOpen(false) : openSelect(Math.max(selectedIndex, 0)))}
                    onKeyDown={onSelectKey}
                    onFocus={() => setFocused("discipline")}
                    onBlur={() => {
                      setSelectOpen(false);
                      blur("discipline");
                    }}
                    className={cx(
                      FIELD,
                      invalid("discipline") ? FIELD_BAD : FIELD_OK,
                      "mt-2 flex items-center justify-between text-left",
                    )}
                  >
                    <span data-sm-select-value className={discipline ? "" : "text-(--iu-muted)"}>
                      {discipline?.label ?? "Choose one"}
                    </span>
                    <ChevronDown
                      size={16}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className={cx(
                        "transition-transform duration-300 motion-reduce:transition-none",
                        selectOpen && "rotate-180",
                      )}
                    />
                  </button>
                  <ul
                    id={id("discipline-list")}
                    role="listbox"
                    aria-labelledby={id("discipline-label")}
                    hidden={!selectOpen}
                    className="absolute inset-x-0 top-[68px] z-20 border border-(--iu-foreground)/40 bg-(--iu-surface) py-1"
                  >
                    {disciplines.map((option, index) => (
                      <li
                        key={option.value}
                        id={id(`discipline-${index}`)}
                        role="option"
                        aria-selected={option.value === values.discipline}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => choose(index)}
                        onMouseMove={() => setSelectActive(index)}
                        className={cx(
                          "flex h-10 cursor-pointer items-center justify-between px-3 text-sm",
                          index === selectActive && "bg-(--iu-foreground)/6",
                        )}
                      >
                        {option.label}
                        {option.value === values.discipline ? (
                          <Check size={16} strokeWidth={1.5} aria-hidden="true" />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <Message id={describedBy("discipline")} error={errors.discipline}>
                    The form you will work in while here.
                  </Message>
                </div>

                {/* Hometown: editable combobox with list autocomplete */}
                <div className="relative">
                  <Label htmlFor={id("hometown")}>Writing from</Label>
                  <input
                    id={id("hometown")}
                    role="combobox"
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-expanded={cityOpen}
                    aria-controls={id("hometown-list")}
                    aria-activedescendant={cityOpen && cityActive >= 0 ? id(`city-${cityActive}`) : undefined}
                    aria-invalid={invalid("hometown") || undefined}
                    aria-describedby={describedBy("hometown")}
                    placeholder="Start typing a city"
                    value={cityQuery}
                    onChange={(event) => {
                      setCityQuery(event.target.value);
                      set("hometown", event.target.value);
                      setCityOpen(true);
                      setCityActive(event.target.value.trim() ? 0 : -1);
                    }}
                    onFocus={() => setFocused("hometown")}
                    onClick={() => setCityOpen(true)}
                    onKeyDown={onCityKey}
                    onBlur={() => {
                      setCityOpen(false);
                      blur("hometown");
                    }}
                    className={cx(FIELD, invalid("hometown") ? FIELD_BAD : FIELD_OK, "mt-2")}
                  />
                  <div
                    hidden={!cityOpen}
                    className="absolute inset-x-0 top-[68px] z-20 max-h-64 [scrollbar-gutter:stable] overflow-y-auto border border-(--iu-foreground)/40 bg-(--iu-surface) py-1"
                  >
                    <ul data-sm-cities id={id("hometown-list")} role="listbox" aria-label="Cities">
                      {matches.map((city, index) => {
                        const [place, country] = city.split(", ");
                        return (
                          <li
                            key={city}
                            id={id(`city-${index}`)}
                            role="option"
                            aria-selected={index === cityActive}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => pickCity(city)}
                            onMouseMove={() => setCityActive(index)}
                            className={cx(
                              "flex h-10 cursor-pointer items-center justify-between gap-3 px-3 text-sm",
                              index === cityActive && "bg-(--iu-foreground)/6",
                            )}
                          >
                            <span>{place}</span>
                            <span className="text-xs text-(--iu-muted)">{country}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <p data-sm-nomatch hidden={matches.length !== 0} className="px-3 py-3 text-sm text-(--iu-muted)">
                      No city matches “<span data-sm-query>{cityQuery}</span>”. Try the nearest one.
                    </p>
                  </div>
                  <p data-sm-citylive aria-live="polite" className="sr-only">
                    {cityOpen && cityQuery.trim()
                      ? `${matches.length} ${matches.length === 1 ? "city" : "cities"} found`
                      : ""}
                  </p>
                  <Message id={describedBy("hometown")} error={errors.hometown}>
                    Where the work is mostly written.
                  </Message>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset disabled={locked} className="m-0 min-w-0 border-0 p-0">
            {sectionTitle("ii.", "The stay")}
            <div className="mt-6 flex flex-col gap-8">
              <fieldset aria-describedby={describedBy("season")} className="m-0 min-w-0 border-0 p-0">
                <legend className={cx("text-(--iu-foreground)", KICKER)}>Season</legend>
                <div className="mt-3 grid gap-px border border-(--iu-foreground)/55 bg-(--iu-foreground)/55 @lg:grid-cols-3">
                  {seasons.map((option, index) => (
                    <label
                      key={option.value}
                      className="group/season relative flex cursor-pointer items-start gap-3 bg-(--iu-surface) p-4 transition-colors duration-300 has-[:checked]:bg-[color-mix(in_oklab,var(--iu-accent)_7%,var(--iu-surface))] has-[:disabled]:cursor-not-allowed has-[:disabled]:text-(--iu-muted) motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/3"
                    >
                      <input
                        type="radio"
                        name={id("season")}
                        value={option.value}
                        checked={values.season === option.value}
                        onChange={() => {
                          set("season", option.value);
                        }}
                        onFocus={() => setFocused("season")}
                        onBlur={() => setFocused(null)}
                        className="mt-0.5 size-4 shrink-0 cursor-pointer appearance-none rounded-full border border-(--iu-foreground)/70 transition-[border-width,border-color] duration-200 checked:border-[5px] checked:border-(--iu-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                      />
                      <span>
                        <span className="block font-serif text-xl leading-none">
                          <span className="text-(--iu-muted) italic">{["i", "ii", "iii", "iv"][index]}.</span>{" "}
                          {option.label}
                        </span>
                        <span className="mt-1.5 block text-sm text-(--iu-muted)">{option.months}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <Message id={describedBy("season")} error={errors.season}>
                  Every stay is four weeks; exact dates follow an offer.
                </Message>
              </fieldset>
            </div>
          </fieldset>

          <fieldset disabled={locked} className="m-0 min-w-0 border-0 p-0">
            {sectionTitle("iii.", "The work")}
            <div className="mt-6 flex flex-col gap-8">
              <div>
                <Label htmlFor={id("title")}>Project title</Label>
                <input
                  id={id("title")}
                  name="title"
                  value={values.title}
                  onChange={(event) => set("title", event.target.value)}
                  onFocus={() => setFocused("title")}
                  onBlur={() => blur("title")}
                  aria-invalid={invalid("title") || undefined}
                  aria-describedby={describedBy("title")}
                  className={cx(FIELD, invalid("title") ? FIELD_BAD : FIELD_OK, "mt-2 font-serif text-xl italic")}
                />
                <Message id={describedBy("title")} error={errors.title}>
                  A working title is fine.
                </Message>
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <Label htmlFor={id("statement")}>Statement</Label>
                  <span
                    data-sm-count
                    className={cx(
                      "font-mono text-xs tabular-nums",
                      words > MAX_WORDS ? "text-rose-700 dark:text-rose-300" : "text-(--iu-muted)",
                    )}
                  >
                    {words} / {MAX_WORDS} words
                  </span>
                </div>
                <textarea
                  id={id("statement")}
                  name="statement"
                  rows={6}
                  value={values.statement}
                  onChange={(event) => set("statement", event.target.value)}
                  onFocus={() => setFocused("statement")}
                  onBlur={() => blur("statement")}
                  aria-invalid={invalid("statement") || undefined}
                  aria-describedby={describedBy("statement")}
                  className={cx(
                    FIELD,
                    invalid("statement") ? FIELD_BAD : FIELD_OK,
                    "mt-2 h-auto resize-y py-2 leading-relaxed",
                  )}
                />
                <Message id={describedBy("statement")} error={errors.statement}>
                  {MIN_WORDS} to {MAX_WORDS} words on what you will write here and why now.
                </Message>
              </div>
            </div>
          </fieldset>

          <div className="flex flex-col gap-4 border-t border-(--iu-foreground) pt-6 @xl:flex-row @xl:items-center @xl:justify-between">
            <p data-sm-note className="text-sm text-pretty text-(--iu-muted)">
              {status === "success"
                ? `Received ${today}. We reply by ${decisionDate}.`
                : `Decisions by ${decisionDate}.`}
            </p>
            <button
              type="submit"
              data-sm-submit
              // Keep focus where it is on press, so blur validation cannot shift the button away mid-click.
              onMouseDown={(event) => event.preventDefault()}
              disabled={disabled || status !== "idle"}
              aria-disabled={disabled || undefined}
              className={cx(
                "inline-flex h-12 min-w-[13.5rem] items-center justify-center gap-3 rounded-[min(var(--iu-radius),2px)] px-6 text-sm font-medium tracking-[0.04em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none",
                status === "success"
                  ? "border border-(--iu-foreground) bg-transparent text-(--iu-foreground)"
                  : disabled
                    ? "cursor-not-allowed border border-dashed border-(--iu-foreground)/40 text-(--iu-muted)"
                    : "bg-(--iu-foreground) text-(--iu-background) disabled:cursor-progress pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_85%,var(--iu-background))]",
              )}
            >
              {status === "loading" ? (
                <>
                  <LoaderCircle
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="animate-spin motion-reduce:animate-none"
                  />
                  Sending
                </>
              ) : status === "success" ? (
                <>
                  <Check size={16} strokeWidth={1.5} aria-hidden="true" />
                  Application received
                </>
              ) : (
                <>
                  {disabled ? "Applications closed" : "Send application"}
                  {disabled ? null : <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />}
                </>
              )}
            </button>
          </div>
          <p data-sm-live aria-live="polite" className="sr-only">
            {announcement}
          </p>
        </form>

        {/* The letter the committee will read, composed from the fields. */}
        <aside
          aria-labelledby={id("letter")}
          className="relative @4xl:col-span-5 @4xl:border-l @4xl:border-(--iu-border) @4xl:pl-12"
        >
          <div className="@4xl:sticky @4xl:top-8">
            <h3 id={id("letter")} className={cx("text-(--iu-muted)", KICKER)}>
              Your letter, as the committee reads it
            </h3>
            <div
              data-sm-card
              className={cx(
                "relative mt-4 border border-(--iu-border) bg-(--iu-background) p-[calc(24px*var(--iu-density))] transition-opacity duration-300 motion-reduce:transition-none dark:border-(--iu-foreground)/15",
              )}
            >
              <p className="font-mono text-xs text-(--iu-muted) tabular-nums">{today}</p>
              <div data-sm-letter className="mt-5 space-y-4 font-serif text-[21px] leading-[1.45] text-pretty">
                <p>Dear committee,</p>
                <p>
                  My name is {clause("name", values.name.trim(), "w-32")}, and I work in{" "}
                  {clause("discipline", discipline?.phrase)} from{" "}
                  {clause("hometown", cities.includes(values.hometown) ? values.hometown.split(", ")[0] : undefined)}. I
                  would like to spend{" "}
                  {clause("season", seasonChoice ? `the ${seasonChoice.label.toLowerCase()}` : undefined, "w-20")} at
                  Saltmarsh finishing{" "}
                  {clause("title", values.title.trim() ? `“${values.title.trim()}”` : undefined, "w-32")}.
                </p>
                <p className="text-(--iu-muted)">
                  {clause(
                    "statement",
                    opening ? (opening.length > 150 ? `${opening.slice(0, 148)}…` : opening) : undefined,
                    "w-40",
                  )}
                </p>
                <p>
                  Yours,
                  <br />
                  <span className="italic">{clause("name", values.name.trim(), "w-28")}</span>
                </p>
              </div>
              {status === "success" ? (
                <svg
                  role="img"
                  aria-label={`Postmarked received, ${today}`}
                  viewBox="0 0 120 120"
                  className="absolute -top-9 -right-2 size-24 rotate-[-12deg] @md:size-28"
                >
                  <circle cx="60" cy="60" r="54" fill="none" strokeWidth="2" className="stroke-(--iu-accent)" />
                  <circle cx="60" cy="60" r="46" fill="none" strokeWidth="1" className="stroke-(--iu-accent)" />
                  <path d="M20 52h80M20 68h80" strokeWidth="1" className="stroke-(--iu-accent)" />
                  <text
                    x="60"
                    y="64"
                    textAnchor="middle"
                    className="fill-(--iu-foreground) font-mono text-[12px] font-semibold tracking-[0.12em]"
                  >
                    RECEIVED
                  </text>
                  <text
                    x="60"
                    y="40"
                    textAnchor="middle"
                    className="fill-(--iu-foreground) font-serif text-[13px] italic"
                  >
                    Saltmarsh
                  </text>
                  <text
                    x="60"
                    y="88"
                    textAnchor="middle"
                    className="fill-(--iu-foreground) font-mono text-[10px] tracking-[0.08em]"
                  >
                    {postmark}
                  </text>
                </svg>
              ) : null}
            </div>
            <p data-sm-caption className="mt-3 text-xs text-(--iu-muted)">
              {status === "success"
                ? "Sent. A copy of this letter is on its way to your inbox."
                : focused
                  ? "The underlined words come from the field you are editing."
                  : "Fill in the form and the letter writes itself."}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default SaltmarshResidencyForm;
