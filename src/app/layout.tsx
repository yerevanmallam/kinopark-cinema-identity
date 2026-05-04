import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

// KinoPark uses Proxima Nova Sans for display + Poppins for body. Inter
// at weight 800/900 is the closest free substitute for the bold uppercase
// display headlines that the site uses everywhere.
const inter = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const poppins = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Find Your Cinema Character — KinoPark",
  description:
    "Drop your KinoPark phone number and discover your cinema-character. Ten archetypes, one of them is you.",
  openGraph: {
    title: "Find Your Cinema Character — KinoPark",
    description: "Ten cinema-character archetypes. One of them is you.",
    siteName: "KinoPark",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Your Cinema Character — KinoPark",
    description: "Ten cinema-character archetypes. One of them is you.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} h-full antialiased`}>
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
