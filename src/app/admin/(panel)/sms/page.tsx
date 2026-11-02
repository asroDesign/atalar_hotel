import { desc } from "drizzle-orm";
import { db } from "@/db";
import { smsLogs } from "@/db/schema";
import { getSettingsFresh } from "@/lib/data";
import { smsEventLabel } from "@/lib/sms";
import { PageHeader } from "@/components/admin/ui";
import { SmsSettingsForm } from "@/components/admin/sms-settings";

export default async function SmsPage() {
  const s = await getSettingsFresh();
  const logs = await db.select().from(smsLogs).orderBy(desc(smsLogs.id)).limit(60);
  const masked = s.smsApiKey ? `${"•".repeat(8)}${s.smsApiKey.slice(-4)}` : "";
  return (
    <div>
      <PageHeader title="پنل پیامک" desc="ارسال پترن با کاوه‌نگار یا sms.ir: اطلاع رزرو به مدیر، ارسال کد رزرو و اعلام تایید/رد به مهمان" />
      <SmsSettingsForm
        s={{
          smsProvider: s.smsProvider,
          smsApiKeyMasked: masked,
          smsAdminMobiles: s.smsAdminMobiles,
          smsNotifyAdminOnRequest: s.smsNotifyAdminOnRequest,
          smsNotifyAdminOnPaid: s.smsNotifyAdminOnPaid,
          smsNotifyGuestOnRequest: s.smsNotifyGuestOnRequest,
          smsTplAdminReservation: s.smsTplAdminReservation,
          smsTplGuestRequest: s.smsTplGuestRequest,
          smsTplGuestConfirmed: s.smsTplGuestConfirmed,
          smsTplGuestRejected: s.smsTplGuestRejected,
        }}
        logs={logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }))}
        eventLabels={smsEventLabel}
      />
    </div>
  );
}
