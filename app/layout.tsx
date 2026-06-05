import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Accountable",
  description: "Stay accountable to your habits",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 pb-24">
          {children}
        </div>
      </body>
    </html>
  );
}
