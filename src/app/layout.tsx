import type { Metadata, Viewport } from "next";
import { Mountains_of_Christmas, Nunito } from "next/font/google";
import Snow from "@/components/Snow";
import "./globals.css";

const festive = Mountains_of_Christmas({
  variable: "--font-festive",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secret Santa",
  description: "Our family's Secret Santa headquarters",
  appleWebApp: { capable: true, title: "Secret Santa", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#b3202e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${festive.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Snow />
        {children}
      </body>
    </html>
  );
}
