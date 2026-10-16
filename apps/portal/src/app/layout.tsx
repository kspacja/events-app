import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import { BOOTSTRAP_SCRIPT } from "@/features/theme-lab/applyOverrides";
import { ThemeLabLoader } from "@/features/theme-lab/ThemeLabLoader";

// Theme lab writes into the repo, so it only ships with next dev
const themeLab = process.env.NODE_ENV === "development";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wydarzenia",
  description:
    "Sprawdź, co dzieje się w twoim mieście. Wydarzenia na wybrane dni na liście i na mapie.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className={`${bricolage.variable} ${dmSans.variable}`}
      // The theme lab script sets token overrides on <html> before hydration
      suppressHydrationWarning={themeLab}
    >
      {themeLab && (
        <head>
          <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP_SCRIPT }} />
        </head>
      )}
      <body>
        {children}
        {themeLab && <ThemeLabLoader />}
      </body>
    </html>
  );
}
