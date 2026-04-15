import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VolunteerPath TO | Toronto Volunteer Opportunities for High School Students",
  description:
    "Find Toronto volunteer opportunities for high school students by duration, summary, requirements, language, and official links.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}