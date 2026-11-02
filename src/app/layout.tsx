import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "vazirmatn/Vazirmatn-Variable-font-face.css";
import "leaflet/dist/leaflet.css";
import "./globals.css";


export const metadata: Metadata = {
  title: {
    default: "هتل آتالار سرعین | آرامشی گرم در دامنه سبلان",
    template: "%s | هتل آتالار",
  },
  description:
    "هتل آتالار سرعین با ۱۶ اتاق و سوئیت، استخر خانوادگی آب گرم معدنی، رستوران سنتی و رزرو آنلاین با صدور کد رزرو.",
};

export const viewport: Viewport = {
  themeColor: "#154440",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" data-theme="atalar">
      <body className="bg-base-200 font-sans text-base-content antialiased">{children}</body>
    </html>
  );
}
