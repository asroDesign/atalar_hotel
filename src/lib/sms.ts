/**
 * SMS sender. Uses Kavenegar when KAVENEGAR_API_KEY is configured
 * (optional KAVENEGAR_SENDER); otherwise the message is simulated and logged.
 */
export async function sendSms(receptor: string, message: string): Promise<"sent" | "simulated" | "failed"> {
  const key = process.env.KAVENEGAR_API_KEY;
  if (!key) {
    console.log(`[SMS simulated] to ${receptor}: ${message}`);
    return "simulated";
  }
  const params = new URLSearchParams({ receptor, message });
  if (process.env.KAVENEGAR_SENDER) params.set("sender", process.env.KAVENEGAR_SENDER);
  try {
    const res = await fetch(`https://api.kavenegar.com/v1/${key}/sms/send.json?${params}`, { cache: "no-store" });
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
