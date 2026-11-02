import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
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
    <html lang="fa" dir="rtl">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
      </head>
      <body className="bg-slate-50 font-sans text-slate-800 antialiased">{children}</body>
    </html>
  );
}
