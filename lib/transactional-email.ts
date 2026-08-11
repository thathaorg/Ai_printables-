// Transactional PDF delivery via Resend (separate from marketing ESP per PRD).
// Uses the plain REST API to avoid an extra dependency.

const RESEND_URL = "https://api.resend.com/emails";

export async function sendWorksheetEmail(opts: {
  to: string;
  worksheetTitle: string;
  pdfBase64: string;
  filename: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY not configured" };

  const from = process.env.RESEND_FROM ?? "Kiwiz <onboarding@resend.dev>";

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: `Your ${opts.worksheetTitle} printable from Kiwiz 🎨`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
            <h2 style="color:#ea580c">Your printable is ready!</h2>
            <p>Thanks for using <strong>Kiwiz</strong>. Your <strong>${opts.worksheetTitle}</strong> worksheet is attached as a print-ready PDF (A4).</p>
            <p>Print tip: choose "Actual size" for the best result.</p>
            <p style="color:#64748b;font-size:13px">You're receiving this because you requested a free printable at kiwiz. </p>
          </div>`,
        attachments: [{ filename: opts.filename, content: opts.pdfBase64 }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn("Resend send failed:", res.status, text);
      return { sent: false, reason: `Resend ${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.warn("Resend error:", err);
    return { sent: false, reason: String(err) };
  }
}
