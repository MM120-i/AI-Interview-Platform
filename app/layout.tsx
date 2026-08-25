import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import "@/app/globals.css";
import { Toaster } from "sonner";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PrepPilot",
  description: "An AI powered platfrom for preping for mock interviews",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark">
      <body className={`${monaSans.className} antialiaseds pattern`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
