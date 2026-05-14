"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "en" | "zh";
type TrackerStatus = "none" | "saved" | "planning" | "applied" | "completed";

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

type TrackerEntry = {
  status: TrackerStatus;
  hours: number;
};

type TrackerState = Record<string, TrackerEntry>;

type ScoredOpportunity = Opportunity & {
  score: number;
  reasons: string[];
  badges: string[];
};

const trackerKey = "volunteerpath-progress-v1";

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

const copy = {
  en: {
    subtitle: "Toronto volunteer matching for high school students",
    navMatch: "Match",
    navTracker: "Tracker",
    navOpportunities: "Opportunities",
    active: "active opportunities",
    headline: "Build a volunteer plan that fits this semester.",
    intro:
      "Answer a few student details, compare the best matches, and track every application from saved to completed hours.",
    updated: "Updated",
    source: "Source",
    views: "Views",
    quiz: "Student match",
    quizHint: "Change the profile and the recommendations update instantly.",
    grade: "Grade",
    interest: "Interest",
    availability: "Availability",
    goal: "Goal",
    location: "Location",
    recommendations: "Recommended now",
    recommendationsHint: "Ranked by fit, requirements, and likely application value.",
    tracker: "Application tracker",
    saved: "Saved",
    planning: "Planning",
    applied: "Applied",
    completed: "Completed",
    hours: "Hours",
    completedHours: "Completed hours",
    filters: "Smart filters",
    results: "results",
    reset: "Reset",
    search: "Search",
    organization: "Organization",
    major: "Major direction",
    age: "Age fit",
    requirements: "Requirements",
    language: "Language",
    bestFor: "Best for",
    detectedFit: "Detected fit",
    lastChecked: "Last checked",
    official: "Official link",
    google: "Search",
    empty: "No opportunities match this set yet.",
    emptyHint: "Broaden the schedule, age, or requirement filters.",
    majors: "Browse by major",
    all: "All",
    noRequirement: "Check official page",
    savedAction: "Save",
  },
  zh: {
    subtitle: "多伦多高中生义工匹配工具",
    navMatch: "匹配",
    navTracker: "进度",
    navOpportunities: "机会",
    active: "个可申请机会",
    headline: "帮你做一份适合本学期的义工计划。",
    intro:
      "填写学生条件，查看推荐机会，并把每个申请从收藏、准备、已申请一直追踪到完成小时数。",
    updated: "更新",
    source: "来源",
    views: "浏览",
    quiz: "学生匹配",
    quizHint: "修改条件后，推荐结果会马上更新。",
    grade: "年级",
    interest: "兴趣",
    availability: "时间",
    goal: "目标",
    location: "地点",
    recommendations: "当前推荐",
    recommendationsHint: "根据匹配度、要求和申请价值排序。",
    tracker: "申请进度",
    saved: "已收藏",
    planning: "准备申请",
    applied: "已申请",
    completed: "已完成",
    hours: "小时",
    completedHours: "完成小时数",
    filters: "精细筛选",
    results: "个结果",
    reset: "重置",
    search: "搜索",
    organization: "机构",
    major: "专业方向",
    age: "年龄",
    requirements: "要求",
    language: "语言",
    bestFor: "适合",
    detectedFit: "系统判断",
    lastChecked: "上次检查",
    official: "官网链接",
    google: "搜索",
    empty: "暂时没有符合条件的机会。",
    emptyHint: "可以放宽时间、年龄或要求筛选。",
    majors: "按专业方向浏览",
    all: "全部",
    noRequirement: "查看官网",
    savedAction: "收藏",
  },
};

const optionLabels = {
  interests: {
    community: { en: "Community", zh: "社区服务" },
    health: { en: "Health", zh: "健康医疗" },
    education: { en: "Education", zh: "教育" },
    environment: { en: "Environment", zh: "环境" },
    animals: { en: "Animals", zh: "动物" },
    leadership: { en: "Leadership", zh: "领导力" },
    stem: { en: "STEM", zh: "理工科" },
    events: { en: "Events", zh: "活动" },
  },
  availability: {
    All: { en: "Any schedule", zh: "不限时间" },
    flexible: { en: "Flexible", zh: "灵活" },
    weekend: { en: "Weekend", zh: "周末" },
    summer: { en: "Summer", zh: "暑假" },
    weekly: { en: "Weekly", zh: "每周" },
    remote: { en: "Remote", zh: "线上" },
  },
  goals: {
    hours: { en: "Get volunteer hours", zh: "拿义工小时" },
    career: { en: "Explore a career field", zh: "探索专业方向" },
    leadership: { en: "Build leadership", zh: "提升领导力" },
    application: { en: "Strengthen applications", zh: "增强申请背景" },
  },
  locations: {
    any: { en: "Anywhere in Toronto", zh: "多伦多不限" },
    remote: { en: "Remote preferred", zh: "优先线上" },
    "in-person": { en: "In-person preferred", zh: "优先线下" },
  },
  requirements: {
    All: { en: "Any requirement", zh: "不限要求" },
    low: { en: "Low barrier", zh: "低门槛" },
    training: { en: "Training okay", zh: "可接受培训" },
    screening: { en: "Screening okay", zh: "可接受筛查" },
  },
  tracker: {
    none: { en: "Not tracking", zh: "未追踪" },
    saved: { en: "Saved", zh: "已收藏" },
    planning: { en: "Planning", zh: "准备申请" },
    applied: { en: "Applied", zh: "已申请" },
    completed: { en: "Completed", zh: "已完成" },
  },
};

export default function HomePage() {
  const [data, setData] = useState<ApiData | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [quiz, setQuiz] = useState<QuizState>(initialQuiz);
  const [tracker, setTracker] = useState<TrackerState>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    try {
      const stored = window.localStorage.getItem(trackerKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [lang, setLang] = useState<Lang>("en");
  const [views, setViews] = useState<number | null>(null);

  const t = copy[lang];

  useEffect(() => {
    fetch("/api/opportunities")
      .then((res) => res.json())
      .then((result) => setData(result));

    fetch("/api/views", { method: "POST" }).then(() => {
      fetch("/api/views")
        .then((res) => res.json())
        .then((result) => setViews(result.views));
    });

  }, []);

  useEffect(() => {
    window.localStorage.setItem(trackerKey, JSON.stringify(tracker));
  }, [tracker]);

  const enrichedOpportunities = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.opportunities.map((item) => enrichOpportunity(item, quiz));
  }, [data, quiz]);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <p className="text-sm text-slate-300">Loading opportunities...</p>
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
    .slice(0, 4);

  const filteredOpportunities = enrichedOpportunities
    .filter((item) => matchesFilters(item, search, filters))
    .sort((a, b) => getStatusWeight(tracker[b.slug]?.status) - getStatusWeight(tracker[a.slug]?.status) || b.score - a.score);

  const trackerStats = getTrackerStats(tracker);

  const updateTracker = (slug: string, next: Partial<TrackerEntry>) => {
    setTracker((current) => {
      const existing = current[slug] ?? { status: "none", hours: 0 };
      const merged = { ...existing, ...next };
      if (merged.status === "none" && merged.hours === 0) {
        const rest = { ...current };
        delete rest[slug];
        return rest;
      }
      return { ...current, [slug]: merged };
    });
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">VolunteerPath TO</h1>
            <p className="text-sm text-slate-500">{t.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <nav className="flex gap-4 text-slate-600">
              <a href="#match">{t.navMatch}</a>
              <a href="#tracker">{t.navTracker}</a>
              <a href="#opportunities">{t.navOpportunities}</a>
            </nav>
            <div className="rounded-md border border-slate-300 bg-white p-1">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`rounded px-2 py-1 ${lang === "en" ? "bg-slate-900 text-white" : "text-slate-600"}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("zh")}
                className={`rounded px-2 py-1 ${lang === "zh" ? "bg-slate-900 text-white" : "text-slate-600"}`}
              >
                中文
              </button>
            </div>
          </div>
        </div>
      </header>

      <section id="match" className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-between rounded-lg border border-white/10 bg-white/5 p-5">
            <div>
              <p className="text-sm font-medium text-teal-300">
                {data.opportunities.length} {t.active}
              </p>
              <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
                {t.headline}
              </h2>
              <p className="mt-4 max-w-2xl text-base text-slate-300">{t.intro}</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Metric label={t.recommendations} value={recommended.length} dark />
              <Metric label={t.saved} value={trackerStats.saved} dark />
              <Metric label={t.applied} value={trackerStats.applied} dark />
              <Metric label={t.completedHours} value={trackerStats.hours} dark />
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 text-slate-950 shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{t.quiz}</h3>
                <p className="mt-1 text-sm text-slate-500">{t.quizHint}</p>
              </div>
              <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">
                Live match
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <SelectField
                label={t.grade}
                value={quiz.grade}
                onChange={(value) => setQuiz((current) => ({ ...current, grade: value }))}
                options={["9", "10", "11", "12"].map((grade) => ({
                  value: grade,
                  label: lang === "en" ? `Grade ${grade}` : `${grade} 年级`,
                }))}
              />
              <SelectField
                label={t.interest}
                value={quiz.interest}
                onChange={(value) => setQuiz((current) => ({ ...current, interest: value }))}
                options={toOptions(optionLabels.interests, lang)}
              />
              <SelectField
                label={t.availability}
                value={quiz.availability}
                onChange={(value) => setQuiz((current) => ({ ...current, availability: value }))}
                options={toOptions(optionLabels.availability, lang).filter((item) => item.value !== "All")}
              />
              <SelectField
                label={t.goal}
                value={quiz.goal}
                onChange={(value) => setQuiz((current) => ({ ...current, goal: value }))}
                options={toOptions(optionLabels.goals, lang)}
              />
              <div className="sm:col-span-2">
                <SelectField
                  label={t.location}
                  value={quiz.location}
                  onChange={(value) => setQuiz((current) => ({ ...current, location: value }))}
                  options={toOptions(optionLabels.locations, lang)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">{t.recommendations}</h3>
                <p className="text-sm text-slate-500">{t.recommendationsHint}</p>
              </div>
              <div className="text-sm text-slate-500">
                {t.updated}: {data.lastUpdated} · {t.views}: {views ?? "..."}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {recommended.map((item) => (
                <RecommendationCard
                  key={item.slug}
                  item={item}
                  lang={lang}
                  tracker={tracker[item.slug]}
                  updateTracker={updateTracker}
                />
              ))}
            </div>
          </section>

          <section
            id="opportunities"
            className="rounded-lg border border-slate-200 bg-white p-5"
          >
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h3 className="text-lg font-semibold">{t.filters}</h3>
                <p className="text-sm text-slate-500">
                  {filteredOpportunities.length} {t.results}
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
                {t.reset}
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-slate-700">{t.search}</span>
                <input
                  type="text"
                  placeholder="health, animals, weekend"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-teal-600"
                />
              </label>
              <SelectField
                label={t.organization}
                value={filters.organization}
                onChange={(value) => setFilters((current) => ({ ...current, organization: value }))}
                options={organizations.map((organization) => ({
                  value: organization,
                  label: organization === "All" ? t.all : organization,
                }))}
              />
              <SelectField
                label={t.major}
                value={filters.major}
                onChange={(value) => setFilters((current) => ({ ...current, major: value }))}
                options={majorOptions.map((major) => ({
                  value: major,
                  label: major === "All" ? t.all : major,
                }))}
              />
              <SelectField
                label={t.availability}
                value={filters.availability}
                onChange={(value) => setFilters((current) => ({ ...current, availability: value }))}
                options={toOptions(optionLabels.availability, lang)}
              />
              <SelectField
                label={t.age}
                value={filters.age}
                onChange={(value) => setFilters((current) => ({ ...current, age: value }))}
                options={[
                  { value: "All", label: t.all },
                  { value: "14", label: "14+" },
                  { value: "15", label: "15+" },
                  { value: "16", label: "16+" },
                ]}
              />
              <SelectField
                label={t.requirements}
                value={filters.requirement}
                onChange={(value) => setFilters((current) => ({ ...current, requirement: value }))}
                options={toOptions(optionLabels.requirements, lang)}
              />
              <SelectField
                label={t.language}
                value={filters.language}
                onChange={(value) => setFilters((current) => ({ ...current, language: value }))}
                options={languageOptions.map((language) => ({
                  value: language,
                  label: language === "All" ? t.all : language,
                }))}
              />
            </div>

            <div className="mt-5 grid gap-3">
              {filteredOpportunities.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="font-medium text-slate-700">{t.empty}</p>
                  <p className="mt-2 text-sm text-slate-500">{t.emptyHint}</p>
                </div>
              )}

              {filteredOpportunities.map((item) => (
                <OpportunityCard
                  key={item.slug}
                  item={item}
                  lang={lang}
                  tracker={tracker[item.slug]}
                  updateTracker={updateTracker}
                />
              ))}
            </div>
          </section>
        </div>

        <aside id="tracker" className="grid h-fit gap-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold">{t.tracker}</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label={t.saved} value={trackerStats.saved} />
              <Metric label={t.planning} value={trackerStats.planning} />
              <Metric label={t.applied} value={trackerStats.applied} />
              <Metric label={t.completed} value={trackerStats.completed} />
            </div>
            <div className="mt-3 rounded-lg bg-teal-50 p-4">
              <p className="text-2xl font-semibold text-teal-900">{trackerStats.hours}</p>
              <p className="text-sm text-teal-800">{t.completedHours}</p>
            </div>
          </section>

          <section id="majors" className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold">{t.majors}</h3>
            <div className="mt-4 grid gap-3">
              {data.majorTracks.map((track) => (
                <div key={track.title} className="rounded-md border border-slate-200 p-3">
                  <h4 className="text-sm font-semibold">{track.title}</h4>
                  <p className="mt-1 text-xs text-slate-500">{track.majors}</p>
                  <p className="mt-2 text-sm text-slate-700">{track.note}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: string | number;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        dark ? "border-white/10 bg-white/10" : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-2xl font-semibold">{value}</p>
      <p className={`mt-1 text-xs ${dark ? "text-slate-300" : "text-slate-500"}`}>
        {label}
      </p>
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
        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
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

function RecommendationCard({
  item,
  lang,
  tracker,
  updateTracker,
}: {
  item: ScoredOpportunity;
  lang: Lang;
  tracker?: TrackerEntry;
  updateTracker: (slug: string, next: Partial<TrackerEntry>) => void;
}) {
  return (
    <article className="flex min-h-[220px] flex-col rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold leading-snug">{item.title}</h4>
          <p className="mt-1 text-xs text-slate-500">{item.organization}</p>
        </div>
        <span className="rounded-md bg-teal-700 px-2 py-1 text-xs font-semibold text-white">
          {item.score}
        </span>
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-slate-700">{item.summary}</p>
      <TagList items={item.reasons.slice(0, 2)} tone="teal" />
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <TrackerControl
          slug={item.slug}
          tracker={tracker}
          updateTracker={updateTracker}
          lang={lang}
          compact
        />
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-slate-900 px-3 py-2 text-xs font-medium"
        >
          {copy[lang].official}
        </a>
      </div>
    </article>
  );
}

function OpportunityCard({
  item,
  lang,
  tracker,
  updateTracker,
}: {
  item: ScoredOpportunity;
  lang: Lang;
  tracker?: TrackerEntry;
  updateTracker: (slug: string, next: Partial<TrackerEntry>) => void;
}) {
  const t = copy[lang];

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-semibold">{item.title}</h4>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
              Match {item.score}
            </span>
            {tracker?.status && tracker.status !== "none" && (
              <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">
                {optionLabels.tracker[tracker.status][lang]}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">{item.organization}</p>
          <p className="mt-3 max-w-3xl text-sm text-slate-700">{item.introduction}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <TrackerControl
            slug={item.slug}
            tracker={tracker}
            updateTracker={updateTracker}
            lang={lang}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <InfoBlock label="Duration" value={item.duration} />
        <InfoBlock label={t.lastChecked} value={formatDate(item.last_checked_at || item.updated_at)} />
        <TagGroup label={t.requirements} items={item.requirements ?? []} fallback={t.noRequirement} />
        <TagGroup label={t.detectedFit} items={item.badges} fallback={t.noRequirement} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-slate-900 px-4 py-2 text-sm font-medium"
        >
          {t.official}
        </a>
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(
            `${item.title} ${item.organization} volunteer`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600"
        >
          {t.google}
        </a>
      </div>
    </article>
  );
}

function TrackerControl({
  slug,
  tracker,
  updateTracker,
  lang,
  compact = false,
}: {
  slug: string;
  tracker?: TrackerEntry;
  updateTracker: (slug: string, next: Partial<TrackerEntry>) => void;
  lang: Lang;
  compact?: boolean;
}) {
  const entry = tracker ?? { status: "none", hours: 0 };

  return (
    <div className={compact ? "grid gap-2" : "grid gap-3"}>
      <select
        value={entry.status}
        onChange={(event) =>
          updateTracker(slug, { status: event.target.value as TrackerStatus })
        }
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-teal-600"
      >
        {toOptions(optionLabels.tracker, lang).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {!compact && (
        <label className="grid gap-1 text-xs text-slate-600">
          {copy[lang].completedHours}
          <input
            type="number"
            min="0"
            value={entry.hours}
            onChange={(event) =>
              updateTracker(slug, { hours: Number(event.target.value || 0) })
            }
            className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-teal-600"
          />
        </label>
      )}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value}</p>
    </div>
  );
}

function TagGroup({
  label,
  items = [],
  fallback,
}: {
  label: string;
  items?: string[];
  fallback: string;
}) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <TagList items={items.length > 0 ? items : [fallback]} />
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
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`rounded border px-2 py-1 text-xs ${classes}`}>
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
  return (
    hasAny(text, ["none", "eligibility varies", "check official page"]) &&
    !hasAny(text, ["screening", "training", "police"])
  );
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

function getTrackerStats(tracker: TrackerState) {
  return Object.values(tracker).reduce(
    (stats, entry) => {
      if (entry.status === "saved") stats.saved += 1;
      if (entry.status === "planning") stats.planning += 1;
      if (entry.status === "applied") stats.applied += 1;
      if (entry.status === "completed") stats.completed += 1;
      stats.hours += entry.hours || 0;
      return stats;
    },
    { saved: 0, planning: 0, applied: 0, completed: 0, hours: 0 }
  );
}

function getStatusWeight(status?: TrackerStatus) {
  if (status === "completed") return 4;
  if (status === "applied") return 3;
  if (status === "planning") return 2;
  if (status === "saved") return 1;
  return 0;
}

function toOptions<T extends string>(
  labels: Record<T, Record<Lang, string>>,
  lang: Lang
) {
  return Object.entries(labels).map(([value, label]) => ({
    value,
    label: (label as Record<Lang, string>)[lang],
  }));
}
