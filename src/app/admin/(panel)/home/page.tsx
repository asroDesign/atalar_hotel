import { getContent } from "@/lib/content";
import { PageHeader } from "@/components/admin/ui";
import { HomeEditor } from "@/components/admin/home-editor";

export default async function Page() {
  const { home } = await getContent();
  return (
    <div>
      <PageHeader title="مدیریت صفحه اصلی" desc="ویدیو و GIF های سکشن اول و استخر، متن‌ها، دکمه‌ها و نمایش یا مخفی کردن هر سکشن" />
      <HomeEditor initial={home} />
    </div>
  );
}
