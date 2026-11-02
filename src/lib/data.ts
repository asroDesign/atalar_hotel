import { db } from "@/db";
import { settings } from "@/db/schema";
import { ensureSeeded } from "./seed";

export const defaultSettings = {
  hotelName: "هتل آتالار",
  hotelNameEn: "Atalar Hotel",
  tagline: "آرامشی گرم در دامنه سبلان",
  stars: "4",
  foundedYear: "1398",
  phone: "045-32223344",
  mobile: "0914-123-4567",
  email: "info@atalarhotel.ir",
  address: "اردبیل، سرعین، بلوار امام خمینی، جنب پارک جنگلی، هتل آتالار",
  lat: "38.1521",
  lng: "48.0762",
  checkInTime: "14:00",
  checkOutTime: "12:00",
  depositPercent: "30",
  cardNumber: "6037-9975-1234-5678",
  cardHolder: "شرکت گردشگری آتالار",
  bankName: "بانک ملی ایران",
  instagram: "atalar.hotel",
  telegram: "atalarhotel",
  whatsapp: "989141234567",
  aboutTitle: "داستان آتالار",
  aboutText:
    "هتل آتالار در سال ۱۳۹۸ با هدف ارائه تجربه‌ای متفاوت از اقامت در قلب شهر توریستی سرعین افتتاح شد. «آتالار» در زبان ترکی به معنای «نیاکان» است؛ نامی که یادآور مهمان‌نوازی اصیل آذربایجانی است. ما با ۱۶ اتاق و سوئیت دنج و یک استخر خانوادگی اختصاصی، فضایی آرام، خصوصی و صمیمی برای خانواده‌ها فراهم کرده‌ایم تا خاطره‌ای گرم در دامنه کوه سبلان بسازند.",
};

export type SiteSettings = typeof defaultSettings;

export async function getSettings(): Promise<SiteSettings> {
  await ensureSeeded();
  const rows = await db.select().from(settings);
  const out: SiteSettings = { ...defaultSettings };
  for (const r of rows) {
    if (r.key in out) (out as Record<string, string>)[r.key] = r.value;
  }
  return out;
}
