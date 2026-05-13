"use client";

import { useEffect, useMemo, useState } from "react";

type Opportunity = {
  id?: number;
  slug: string;
  title: string;
  organization: string;
  duration: string;
  introduction: string;
  summary: string;
  best_for?: string[];
  requirements?: string[];
  languages?: string[];
  link: string;
  source_type?: string;
  source_name?: string;
  is_active?: boolean;
  last_checked_at?: string;
  created_at?: string;
  updated_at?: string;
};

type MajorTrack = {
  title: string;
  majors: string;
  note: string;
};

type ApiData = {
  lastUpdated: string;
  source: string;
  opportunities: Opportunity[];
  majorTracks: MajorTrack[];
};

type QuizState = {
  grade: string;
  interest: string;
  availability: string;
  goal: string;
  location: string;
};

type FilterState = {
  organization: string;
  major: string;
  availability: string;
  age: string;
  requirement: string;
  language: string;
};

type ScoredOpportunity = Opportunity & {
  score: number;
  reasons: string[];
  badges: string[];
};

const initialQuiz: QuizState = {
  grade: "10",
  interest: "community",
  availability: "flexible",
  goal: "hours",
  location: "any",
};

const initialFilters: FilterState = {
  organization: "All",
  major: "All",
  availability: "All",
  age: "All",
  requirement: "All",
  language: "All",
};

const interests = [
  { value: "community", label: "Community" },
  { value: "health", label: "Health" },
  { value: "education", label: "Education" },
  { value: "environment", label: "Environment" },
  { value: "animals", label: "Animals" },
  { value: "leadership", label: "Leadership" },
  { value: "stem", label: "STEM" },
  { value: "events", label: "Events" },
];

const availabilityOptions = [
  { value: "All", label: "Any schedule" },
  { value: "weekend", label: "Weekend" },
  { value: "summer", label: "Summer" },
  { value: "weekly", label: "Weekly" },
  { value: "remote", label: "Remote" },
  { value: "flexible", label: "Flexible" },
];

const ageOptions = [
  { value: "All", label: "Any age" },
  { value: "14", label: "14+" },
  { value: "15", label: "15+" },
  { value: "16", label: "16+" },
];

export default function HomePage() {
  const [data, setData] = useState<ApiData | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [quiz, setQuiz] = useState<QuizState>(initialQuiz);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/opportunities")
      .then((res) => res.json())
      .then((result) => setData(result));

    fetch("/api/views", { method: "POST" }).then(() => {
      fetch("/api/views")
        .then((res) => res.json())
        .then((result) => {
          setViews(result.views);
        });
    });
  }, []);

  const enrichedOpportunities = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.opportunities.map((item) => enrichOpportunity(item, quiz));
  }, [data, quiz]);

  if (!data) {
    return (
      <main className="min-h-screen bg-stone-50 p-6 text-slate-900">
        <p className="text-sm text-slate-600">Loading opportunities...</p>
      </main>
    );
  }

  const organizations = [
    "All",
    ...Array.from(new Set(data.opportunities.map((item) => item.organization))).sort(),
  ];

  const majorOptions = ["All", ...data.majorTracks.map((track) => track.title)];
  const languageOptions = [
    "All",
    ...Array.from(
      new Set(data.opportunities.flatMap((item) => item.languages ?? ["English"]))
    ).sort(),
  ];

  const recommended = [...enrichedOpportunities]
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 5);

  const filteredOpportunities = enrichedOpportunities
    .filter((item) => matchesFilters(item, search, filters))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  const activeFilterCount = [
    filters.organization !== "All",
    filters.major !== "All",
    filters.availability !== "All",
    filters.age !== "All",
    filters.requirement !== "All",
    filters.language !== "All",
    search.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">VolunteerPath TO</h1>
            <p className="text-sm text-slate-500">
              Toronto volunteer matching for high school students
            </p>
          </div>

          <nav className="flex gap-5 text-sm text-slate-600">
            <a href="#match">Match</a>
            <a href="#opportunities">Opportunities</a>
            <a href="#majors">Majors</a>
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-sm font-medium text-teal-700">
              {data.opportunities.length} active opportunities
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight">
              Find the volunteer option that actually fits your schedule,
              interests, and application goals.
            </h2>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-500">
              <span>Last updated: {data.lastUpdated}</span>
              <span>Source: {data.source}</span>
              <span>Views: {views ?? "..."}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Metric label="Recommended" value={recommended.length.toString()} />
            <Metric label="Sources" value={organizations.length - 1} />
            <Metric label="Filters" value={activeFilterCount.toString()} />
          </div>
        </div>
      </section>

      <section id="match" className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Student match quiz</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Tune the list around current student needs.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={showRecommendations}
                  onChange={(event) => setShowRecommendations(event.target.checked)}
                  className="h-4 w-4"
                />
                Show
              </label>
            </div>

            <div className="mt-5 grid gap-4">
              <SelectField
                label="Grade"
                value={quiz.grade}
                onChange={(value) => setQuiz((current) => ({ ...current, grade: value }))}
                options={[
                  { value: "9", label: "Grade 9" },
                  { value: "10", label: "Grade 10" },
                  { value: "11", label: "Grade 11" },
                  { value: "12", label: "Grade 12" },
                ]}
              />

              <SelectField
                label="Main interest"
                value={quiz.interest}
                onChange={(value) => setQuiz((current) => ({ ...current, interest: value }))}
                options={interests}
              />

              <SelectField
                label="Available time"
                value={quiz.availability}
                onChange={(value) =>
                  setQuiz((current) => ({ ...current, availability: value }))
                }
                options={[
                  { value: "flexible", label: "Flexible" },
                  { value: "weekend", label: "Weekend" },
                  { value: "summer", label: "Summer" },
                  { value: "weekly", label: "Weekly" },
                  { value: "remote", label: "Remote" },
                ]}
              />

              <SelectField
                label="Current goal"
                value={quiz.goal}
                onChange={(value) => setQuiz((current) => ({ ...current, goal: value }))}
                options={[
                  { value: "hours", label: "Get volunteer hours" },
                  { value: "career", label: "Explore a career field" },
                  { value: "leadership", label: "Build leadership" },
                  { value: "application", label: "Strengthen applications" },
                ]}
              />

              <SelectField
                label="Location"
                value={quiz.location}
                onChange={(value) =>
                  setQuiz((current) => ({ ...current, location: value }))
                }
                options={[
                  { value: "any", label: "Anywhere in Toronto" },
                  { value: "remote", label: "Remote preferred" },
                  { value: "in-person", label: "In-person preferred" },
                ]}
              />
            </div>
          </aside>

          <div className="grid gap-4">
            {showRecommendations && (
              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Best matches</h3>
                    <p className="text-sm text-slate-500">
                      Ranked by interest, schedule, age fit, and application value.
                    </p>
                  </div>
                  <a href="#opportunities" className="text-sm font-medium text-teal-700">
                    View all filtered results
                  </a>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {recommended.map((item) => (
                    <RecommendationCard key={item.slug} item={item} />
                  ))}
                </div>
              </section>
            )}

            <section
              id="opportunities"
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Opportunity filters</h3>
                  <p className="text-sm text-slate-500">
                    {filteredOpportunities.length} result
                    {filteredOpportunities.length === 1 ? "" : "s"} match the current filters.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilters(initialFilters);
                  }}
                  className="w-fit rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  Reset filters
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-700">Search</span>
                  <input
                    type="text"
                    placeholder="Try health, animals, weekend..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-teal-600"
                  />
                </label>

                <SelectField
                  label="Organization"
                  value={filters.organization}
                  onChange={(value) =>
                    setFilters((current) => ({ ...current, organization: value }))
                  }
                  options={organizations.map((organization) => ({
                    value: organization,
                    label: organization,
                  }))}
                />

                <SelectField
                  label="Major direction"
                  value={filters.major}
                  onChange={(value) => setFilters((current) => ({ ...current, major: value }))}
                  options={majorOptions.map((major) => ({ value: major, label: major }))}
                />

                <SelectField
                  label="Availability"
                  value={filters.availability}
                  onChange={(value) =>
                    setFilters((current) => ({ ...current, availability: value }))
                  }
                  options={availabilityOptions}
                />

                <SelectField
                  label="Age fit"
                  value={filters.age}
                  onChange={(value) => setFilters((current) => ({ ...current, age: value }))}
                  options={ageOptions}
                />

                <SelectField
                  label="Requirements"
                  value={filters.requirement}
                  onChange={(value) =>
                    setFilters((current) => ({ ...current, requirement: value }))
                  }
                  options={[
                    { value: "All", label: "Any requirement" },
                    { value: "low", label: "Low barrier" },
                    { value: "training", label: "Training okay" },
                    { value: "screening", label: "Screening okay" },
                  ]}
                />

                <SelectField
                  label="Language"
                  value={filters.language}
                  onChange={(value) =>
                    setFilters((current) => ({ ...current, language: value }))
                  }
                  options={languageOptions.map((language) => ({
                    value: language,
                    label: language,
                  }))}
                />
              </div>

              <div className="mt-6 grid gap-4">
                {filteredOpportunities.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-stone-50 p-8 text-center">
                    <p className="text-base font-medium text-slate-700">
                      No opportunities match this set yet.
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Broaden the schedule, age, or requirement filters.
                    </p>
                  </div>
                )}

                {filteredOpportunities.map((item) => (
                  <OpportunityCard key={item.slug} item={item} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>

      <section id="majors" className="mx-auto max-w-7xl px-5 pb-12">
        <h3 className="mb-4 text-lg font-semibold">Browse by major</h3>

        <div className="grid gap-4 md:grid-cols-2">
          {data.majorTracks.map((track) => (
            <div
              key={track.title}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <h4 className="text-base font-semibold">{track.title}</h4>
              <p className="mt-2 text-sm text-slate-600">{track.majors}</p>
              <p className="mt-3 text-sm text-slate-700">{track.note}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-stone-50 p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-teal-600"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RecommendationCard({ item }: { item: ScoredOpportunity }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-stone-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold leading-snug">{item.title}</h4>
          <p className="mt-1 text-sm text-slate-500">{item.organization}</p>
        </div>
        <span className="rounded-md bg-teal-700 px-2 py-1 text-xs font-semibold text-white">
          {item.score}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-700">{item.summary}</p>
      <TagList items={item.reasons.slice(0, 3)} tone="teal" />
      <a
        href={item.link}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex rounded-md border border-slate-900 px-3 py-2 text-sm font-medium"
      >
        Official link
      </a>
    </article>
  );
}

function OpportunityCard({ item }: { item: ScoredOpportunity }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_180px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xl font-semibold">{item.title}</h4>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
              Match {item.score}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{item.organization}</p>
          <p className="mt-4 text-slate-700">{item.introduction}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-stone-50 p-3">
          <InfoRow label="Duration" value={item.duration} />
          <div className="mt-3">
            <InfoRow
              label="Last checked"
              value={formatDate(item.last_checked_at || item.updated_at)}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <TagGroup label="Best for" items={item.best_for ?? []} />
        <TagGroup label="Requirements" items={item.requirements ?? []} />
        <TagGroup label="Detected fit" items={item.badges} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-slate-900 px-4 py-2 text-sm font-medium"
        >
          Official link
        </a>
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(
            `${item.title} ${item.organization} volunteer`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600"
        >
          Search
        </a>
      </div>
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value}</p>
    </div>
  );
}

function TagGroup({ label, items = [] }: { label: string; items?: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <TagList items={items.length > 0 ? items : ["Check official page"]} />
    </div>
  );
}

function TagList({
  items,
  tone = "slate",
}: {
  items: string[];
  tone?: "slate" | "teal";
}) {
  const classes =
    tone === "teal"
      ? "border-teal-200 bg-teal-50 text-teal-800"
      : "border-slate-200 bg-white text-slate-700";

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`rounded-md border px-2 py-1 text-xs ${classes}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function enrichOpportunity(item: Opportunity, quiz: QuizState): ScoredOpportunity {
  const text = getSearchText(item);
  const badges = detectBadges(item);
  const reasons: string[] = [];
  let score = 50;

  if (text.includes(quiz.interest)) {
    score += 18;
    reasons.push(`Matches ${quiz.interest}`);
  }

  if (quiz.goal === "hours" && hasFlexibleFit(text)) {
    score += 12;
    reasons.push("Good for hours");
  }

  if (quiz.goal === "career" && text.includes(quiz.interest)) {
    score += 10;
    reasons.push("Career-aligned");
  }

  if (quiz.goal === "leadership" && text.includes("leadership")) {
    score += 12;
    reasons.push("Leadership value");
  }

  if (quiz.goal === "application" && hasApplicationValue(text)) {
    score += 10;
    reasons.push("Application value");
  }

  if (quiz.availability !== "flexible" && text.includes(quiz.availability)) {
    score += 12;
    reasons.push(`${quiz.availability} fit`);
  }

  if (quiz.availability === "flexible" && hasFlexibleFit(text)) {
    score += 8;
    reasons.push("Flexible timing");
  }

  if (quiz.location === "remote" && text.includes("remote")) {
    score += 10;
    reasons.push("Remote option");
  }

  if (quiz.location === "in-person" && !text.includes("remote")) {
    score += 5;
    reasons.push("In-person likely");
  }

  const studentAge = gradeToLikelyAge(quiz.grade);
  const minimumAge = detectMinimumAge(text);
  if (!minimumAge || studentAge >= minimumAge) {
    score += 10;
    reasons.push(minimumAge ? `Age ${minimumAge}+ fit` : "Age flexible");
  } else {
    score -= 20;
    reasons.push(`May require age ${minimumAge}+`);
  }

  if (reasons.length === 0) {
    reasons.push("Worth checking");
  }

  return {
    ...item,
    score: Math.max(0, Math.min(100, score)),
    reasons,
    badges,
  };
}

function matchesFilters(item: ScoredOpportunity, search: string, filters: FilterState) {
  const text = getSearchText(item);
  const minimumAge = detectMinimumAge(text);

  const matchesSearch = search.trim().length === 0 || text.includes(search.toLowerCase());
  const matchesOrganization =
    filters.organization === "All" || item.organization === filters.organization;
  const matchesMajor = filters.major === "All" || matchesMajorTrack(text, filters.major);
  const matchesAvailability =
    filters.availability === "All" || text.includes(filters.availability.toLowerCase());
  const matchesAge =
    filters.age === "All" || !minimumAge || Number(filters.age) >= minimumAge;
  const matchesRequirement =
    filters.requirement === "All" ||
    (filters.requirement === "low" && isLowBarrier(text)) ||
    (filters.requirement === "training" && text.includes("training")) ||
    (filters.requirement === "screening" && text.includes("screening"));
  const matchesLanguage =
    filters.language === "All" || (item.languages ?? []).includes(filters.language);

  return (
    matchesSearch &&
    matchesOrganization &&
    matchesMajor &&
    matchesAvailability &&
    matchesAge &&
    matchesRequirement &&
    matchesLanguage
  );
}

function matchesMajorTrack(text: string, major: string) {
  if (major === "Education & Humanities") {
    return hasAny(text, ["education", "library", "youth", "learn"]);
  }
  if (major === "Health & Life Sciences") {
    return hasAny(text, ["health", "hospital", "mental", "food", "community"]);
  }
  if (major === "Business & Leadership") {
    return hasAny(text, ["business", "leadership", "event", "fundraising", "outreach"]);
  }
  if (major === "Environment & STEM") {
    return hasAny(text, ["environment", "conservation", "stem", "coding", "science"]);
  }
  return true;
}

function detectBadges(item: Opportunity) {
  const text = getSearchText(item);
  const badges = new Set<string>();

  if (text.includes("remote")) badges.add("Remote");
  if (text.includes("weekend")) badges.add("Weekend");
  if (text.includes("summer") || text.includes("seasonal")) badges.add("Seasonal");
  if (text.includes("weekly")) badges.add("Weekly");
  if (hasFlexibleFit(text)) badges.add("Flexible");
  if (isLowBarrier(text)) badges.add("Low barrier");

  const minimumAge = detectMinimumAge(text);
  badges.add(minimumAge ? `Age ${minimumAge}+` : "Check age");

  return Array.from(badges).slice(0, 5);
}

function getSearchText(item: Opportunity) {
  return [
    item.title,
    item.organization,
    item.duration,
    item.introduction,
    item.summary,
    ...(item.best_for ?? []),
    ...(item.requirements ?? []),
    ...(item.languages ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function detectMinimumAge(text: string) {
  const match = text.match(/age\s*(\d{2})\+?/);
  return match ? Number(match[1]) : null;
}

function gradeToLikelyAge(grade: string) {
  return Number(grade) + 5;
}

function hasFlexibleFit(text: string) {
  return hasAny(text, ["flexible", "event", "weekend", "seasonal", "check official page"]);
}

function hasApplicationValue(text: string) {
  return hasAny(text, ["leadership", "health", "education", "stem", "community", "event"]);
}

function isLowBarrier(text: string) {
  return hasAny(text, ["none", "eligibility varies", "check official page"]) &&
    !hasAny(text, ["screening", "training", "police"]);
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function formatDate(value?: string) {
  if (!value) {
    return "Check official page";
  }

  return new Date(value).toISOString().split("T")[0];
}
