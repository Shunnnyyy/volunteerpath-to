import * as cheerio from "cheerio";

export type ScrapedOpportunity = {
  title: string;
  organization: string;
  duration: string;
  introduction: string;
  summary: string;
  bestFor: string[];
  requirements: string[];
  languages: string[];
  link: string;
  sourceName: string;
};

type SourceDefinition = {
  organization: string;
  url: string;
  sourceName: string;
  fallbackTitle: string;
  fallbackSummary: string;
  bestFor: string[];
  requirements: string[];
};

const sources: SourceDefinition[] = [
  {
    organization: "Volunteer Toronto",
    url: "https://www.volunteertoronto.ca/networking/opening_search.asp",
    sourceName: "volunteer_toronto",
    fallbackTitle: "Volunteer Toronto Opportunities",
    fallbackSummary:
      "Search Toronto volunteer postings across nonprofit, event, youth, health, and community organizations.",
    bestFor: ["community", "leadership", "events"],
    requirements: ["Eligibility varies by posting"],
  },
  {
    organization: "Toronto Public Library",
    url: "https://www.torontopubliclibrary.ca/support-us/volunteering/",
    sourceName: "toronto_public_library",
    fallbackTitle: "Toronto Public Library Volunteering",
    fallbackSummary:
      "Student-friendly library volunteer opportunities connected to reading, learning, and community programs.",
    bestFor: ["education", "community", "high school students"],
    requirements: ["Age rules may vary by branch", "Reliable attendance"],
  },
  {
    organization: "City of Toronto",
    url: "https://www.toronto.ca/community-people/get-involved/volunteer-with-the-city/",
    sourceName: "city_of_toronto",
    fallbackTitle: "City of Toronto Volunteer Programs",
    fallbackSummary:
      "Official City of Toronto volunteer programs for civic, recreation, event, and community involvement.",
    bestFor: ["leadership", "environment", "community"],
    requirements: ["Program eligibility may vary"],
  },
  {
    organization: "Daily Bread Food Bank",
    url: "https://www.dailybread.ca/ways-to-give/volunteer/",
    sourceName: "daily_bread_food_bank",
    fallbackTitle: "Daily Bread Food Bank Volunteer",
    fallbackSummary:
      "Food sorting, warehouse, kitchen, and community support volunteer roles helping Toronto families.",
    bestFor: ["community", "service", "food security"],
    requirements: ["Age rules may vary by shift"],
  },
  {
    organization: "Toronto Humane Society",
    url: "https://www.torontohumanesociety.com/ways-to-give/volunteer/",
    sourceName: "toronto_humane_society",
    fallbackTitle: "Toronto Humane Society Volunteer",
    fallbackSummary:
      "Animal care and shelter support roles for students interested in compassion, care, and nonprofit service.",
    bestFor: ["animals", "health", "community"],
    requirements: ["Screening or training may be required"],
  },
  {
    organization: "YMCA of Greater Toronto",
    url: "https://www.ymcagta.org/volunteer",
    sourceName: "ymca_gta",
    fallbackTitle: "YMCA Greater Toronto Volunteer",
    fallbackSummary:
      "Youth, recreation, camp, wellness, and community volunteer options across the Greater Toronto Area.",
    bestFor: ["leadership", "sports", "youth"],
    requirements: ["Eligibility varies by program"],
  },
  {
    organization: "Canadian Red Cross",
    url: "https://www.redcross.ca/volunteer",
    sourceName: "canadian_red_cross",
    fallbackTitle: "Canadian Red Cross Volunteer",
    fallbackSummary:
      "Community support, emergency response, fundraising, and outreach volunteer roles with training options.",
    bestFor: ["health", "community", "leadership"],
    requirements: ["Screening and training may be required"],
  },
  {
    organization: "Second Harvest",
    url: "https://secondharvest.ca/get-involved/volunteer/",
    sourceName: "second_harvest",
    fallbackTitle: "Second Harvest Volunteer",
    fallbackSummary:
      "Food rescue, delivery, event, and community support opportunities for students interested in impact.",
    bestFor: ["community", "environment", "food security"],
    requirements: ["Eligibility varies by role"],
  },
  {
    organization: "Toronto Zoo",
    url: "https://www.torontozoo.com/tz/volunteers",
    sourceName: "toronto_zoo",
    fallbackTitle: "Toronto Zoo Volunteer",
    fallbackSummary:
      "Education, conservation, event, and visitor-support volunteering connected to wildlife and public learning.",
    bestFor: ["animals", "environment", "education"],
    requirements: ["Age rules and training may apply"],
  },
  {
    organization: "CAMH",
    url: "https://www.camh.ca/en/get-involved/volunteer",
    sourceName: "camh",
    fallbackTitle: "CAMH Volunteer",
    fallbackSummary:
      "Mental health and hospital-adjacent volunteer opportunities involving visitor support and community care.",
    bestFor: ["psychology", "health", "community"],
    requirements: ["Screening and training may be required"],
  },
];

export async function scrapeVolunteerOpportunities() {
  const settled = await Promise.allSettled(sources.map(scrapeSource));
  const opportunities: ScrapedOpportunity[] = [];
  const errors: { source: string; error: string }[] = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      opportunities.push(result.value);
      return;
    }

    const source = sources[index];
    errors.push({
      source: source.sourceName,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    });
    opportunities.push(buildFallbackOpportunity(source));
  });

  return { opportunities: dedupeByLink(opportunities), errors };
}

async function scrapeSource(source: SourceDefinition): Promise<ScrapedOpportunity> {
  const response = await fetch(source.url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (compatible; VolunteerPathTO/1.0; +https://volunteerpath-to.vercel.app)",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(`${source.url} returned ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const pageTitle = cleanText(
    $("meta[property='og:title']").attr("content") ||
      $("meta[name='twitter:title']").attr("content") ||
      $("h1").first().text() ||
      $("title").text() ||
      source.fallbackTitle
  );
  const description = cleanText(
    $("meta[name='description']").attr("content") ||
      $("meta[property='og:description']").attr("content") ||
      $("main p").first().text() ||
      source.fallbackSummary
  );

  return {
    title: pageTitle || source.fallbackTitle,
    organization: source.organization,
    duration: inferDuration(description),
    introduction: description || source.fallbackSummary,
    summary: summarize(description || source.fallbackSummary, source),
    bestFor: inferBestFor(`${pageTitle} ${description}`, source.bestFor),
    requirements: source.requirements,
    languages: ["English"],
    link: source.url,
    sourceName: source.sourceName,
  };
}

function buildFallbackOpportunity(source: SourceDefinition): ScrapedOpportunity {
  return {
    title: source.fallbackTitle,
    organization: source.organization,
    duration: "Check official page",
    introduction: source.fallbackSummary,
    summary: source.fallbackSummary,
    bestFor: source.bestFor,
    requirements: source.requirements,
    languages: ["English"],
    link: source.url,
    sourceName: source.sourceName,
  };
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").replace(/\s+\|.*$/, "").trim();
}

function summarize(value: string, source: SourceDefinition) {
  const text = cleanText(value || source.fallbackSummary);
  if (text.length <= 220) {
    return text;
  }
  return `${text.slice(0, 217).trim()}...`;
}

function inferDuration(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("seasonal") || lower.includes("summer")) {
    return "Seasonal";
  }
  if (lower.includes("event")) {
    return "Event-based";
  }
  if (lower.includes("weekly")) {
    return "Weekly";
  }
  return "Check official page";
}

function inferBestFor(text: string, fallback: string[]) {
  const lower = text.toLowerCase();
  const tags = new Set(fallback);

  if (lower.includes("youth") || lower.includes("student") || lower.includes("teen")) {
    tags.add("high school students");
  }
  if (lower.includes("health") || lower.includes("hospital") || lower.includes("mental")) {
    tags.add("health");
  }
  if (lower.includes("food")) {
    tags.add("food security");
  }
  if (lower.includes("animal") || lower.includes("wildlife")) {
    tags.add("animals");
  }
  if (lower.includes("environment") || lower.includes("conservation")) {
    tags.add("environment");
  }
  if (lower.includes("library") || lower.includes("learn") || lower.includes("education")) {
    tags.add("education");
  }

  return Array.from(tags).slice(0, 6);
}

function dedupeByLink(opportunities: ScrapedOpportunity[]) {
  const seen = new Set<string>();
  return opportunities.filter((item) => {
    if (seen.has(item.link)) {
      return false;
    }
    seen.add(item.link);
    return true;
  });
}
