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
};

export async function fetchTorontoLibraryVolunteerPage(): Promise<ScrapedOpportunity[]> {
  const url = "https://www.torontopubliclibrary.ca/support-us/volunteering/";

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 VolunteerPathTO Bot",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Toronto Public Library page: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const pageTitle = $("title").text().trim() || "Toronto Public Library Teen Volunteering";

  return [
    {
      title: pageTitle,
      organization: "Toronto Public Library",
      duration: "Check official page",
      introduction:
        "A student-friendly volunteer opportunity for teens interested in reading, learning, and community support.",
      summary:
        "Official Toronto Public Library volunteer information page collected by VolunteerPath TO.",
      bestFor: ["High school students", "Education interests", "Community-minded students"],
      requirements: ["Check official posting", "Age rules may vary", "Reliable attendance"],
      languages: ["English"],
      link: url,
    },
  ];
}

export async function fetchCityOfTorontoVolunteerPage(): Promise<ScrapedOpportunity[]> {
  const url = "https://www.toronto.ca/community-people/get-involved/volunteer-with-the-city/";

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 VolunteerPathTO Bot",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch City of Toronto page: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const pageTitle = $("title").text().trim() || "City of Toronto Volunteer Programs";

  return [
    {
      title: pageTitle,
      organization: "City of Toronto",
      duration: "Check official page",
      introduction:
        "A public-facing volunteer option for students interested in community programs, events, and civic involvement.",
      summary:
        "Official City of Toronto volunteer information page collected by VolunteerPath TO.",
      bestFor: ["Leadership interests", "Public policy interests", "Community-minded students"],
      requirements: ["Check official posting", "Program eligibility may vary", "Reliable participation"],
      languages: ["English"],
      link: url,
    },
  ];
}