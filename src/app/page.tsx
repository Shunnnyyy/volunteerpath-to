"use client";

import { useEffect, useState } from "react";

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

export default function HomePage() {
  const [data, setData] = useState<ApiData | null>(null);
  const [search, setSearch] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState("All");
  const [majorFilter, setMajorFilter] = useState("All");

  useEffect(() => {
    fetch("/api/opportunities")
      .then((res) => res.json())
      .then((data) => setData(data));
  }, []);

  if (!data) {
    return <p className="p-6">Loading...</p>;
  }

  const organizations = [
    "All",
    ...Array.from(new Set(data.opportunities.map((item) => item.organization))),
  ];

  const majorOptions = ["All", ...data.majorTracks.map((track) => track.title)];

  const filteredOpportunities = data.opportunities.filter((item) => {
    const lowerSearch = search.toLowerCase();

    const matchesSearch =
      item.title.toLowerCase().includes(lowerSearch) ||
      item.summary.toLowerCase().includes(lowerSearch) ||
      item.introduction.toLowerCase().includes(lowerSearch);

    const matchesOrganization =
      organizationFilter === "All" || item.organization === organizationFilter;

    const bestForText = (item.best_for ?? []).join(" ").toLowerCase();
    const summaryText = item.summary.toLowerCase();

    const matchesMajor =
      majorFilter === "All" ||
      (majorFilter === "Education & Humanities" &&
        (bestForText.includes("education") || summaryText.includes("education"))) ||
      (majorFilter === "Health & Life Sciences" &&
        (summaryText.includes("health") || summaryText.includes("community"))) ||
      (majorFilter === "Business & Leadership" &&
        (summaryText.includes("leadership") || summaryText.includes("organization"))) ||
      (majorFilter === "Environment & STEM" &&
        (summaryText.includes("city") || summaryText.includes("sustainability")));

    return matchesSearch && matchesOrganization && matchesMajor;
  });

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">VolunteerPath TO</h1>
            <p className="text-sm text-slate-500">
              Toronto volunteer guide for high school students
            </p>
          </div>

          <nav className="hidden gap-6 text-sm text-slate-600 md:flex">
            <a href="#top">Home</a>
            <a href="#opportunities">Opportunities</a>
            <a href="#majors">Browse by Major</a>
          </nav>
        </div>
      </header>

      <section id="top" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-4xl font-bold leading-tight">
          Find volunteer opportunities in Toronto
        </h2>
        <p className="mt-4 max-w-2xl text-slate-600">
          Compare opportunities by summary, duration, requirements, language, and
          future study direction.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
          <span>Last updated: {data.lastUpdated}</span>
          <span>Source: {data.source}</span>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#opportunities"
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white"
          >
            Explore opportunities
          </a>

          <a
            href="#majors"
            className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-800"
          >
            Browse by major
          </a>
        </div>
      </section>

      <section id="opportunities" className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-2xl font-semibold">Opportunities</h3>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              placeholder="Search opportunities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none"
            />

            <select
              value={organizationFilter}
              onChange={(e) => setOrganizationFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none"
            >
              {organizations.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>

            <select
              value={majorFilter}
              onChange={(e) => setMajorFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none"
            >
              {majorOptions.map((major) => (
                <option key={major} value={major}>
                  {major}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredOpportunities.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-base font-medium text-slate-700">
                No opportunities match your search right now.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try another keyword, organization, or major direction.
              </p>
            </div>
          )}

          {filteredOpportunities.map((item) => (
              <article
                  key={item.slug}
                  className="rounded-3xl border border-slate-200 bg-white p-6"
              >
                <h4 className="text-2xl font-semibold">{item.title}</h4>
                <p className="mt-1 text-sm text-slate-500">{item.organization}</p>

                <div className="mt-5 space-y-4">
                  <InfoRow label="Duration" value={item.duration}/>
                  <InfoRow label="Introduction" value={item.introduction}/>
                  <InfoRow label="Summary" value={item.summary}/>
                  <TagRow label="Best for" items={item.best_for ?? []}/>
                  <TagRow label="Requirements" items={item.requirements ?? []}/>
                  <TagRow label="Languages" items={item.languages ?? []}/>
                </div>

                <div className="mt-6 flex gap-2">
                  {/* 原按钮 */}
                  <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block rounded-2xl border border-slate-900 px-4 py-2 text-sm font-medium"
                  >
                    Official link
                  </a>

                  {/* fallback */}
                  <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(
                          item.title + " " + item.organization
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block rounded-2xl border border-slate-300 px-4 py-2 text-sm text-gray-500"
                  >
                    Search
                  </a>
                </div>
              </article>
          ))}
        </div>
      </section>

      <section id="majors" className="mx-auto max-w-6xl px-6 pb-20">
        <h3 className="mb-6 text-2xl font-semibold">Browse by Major</h3>

        <div className="grid gap-6 md:grid-cols-2">
          {data.majorTracks.map((track) => (
            <div
              key={track.title}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
            >
              <h4 className="text-xl font-semibold">{track.title}</h4>
              <p className="mt-3 text-slate-600">{track.majors}</p>
              <p className="mt-4 text-sm text-slate-700">{track.note}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function TagRow({ label, items = [] }: { label: string; items?: string[] }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}