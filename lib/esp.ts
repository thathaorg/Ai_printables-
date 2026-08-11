// ESP (email service provider) sync — provider kept configurable per PRD.
// Leads and list subscriptions are always recorded in our own DB (the CRM of
// record); if an ESP key is configured we mirror them there. Supported now:
// Beehiiv (BEEHIIV_API_KEY + BEEHIIV_PUBLICATION_ID). Adding Kit/Mailchimp
// later = adding one function here.

export interface EspContact {
  email: string;
  tags: string[]; // preset, topic, age, style, bridge id, campaign, utm
  lists?: string[];
}

export async function syncContactToEsp(contact: EspContact): Promise<void> {
  const beehiivKey = process.env.BEEHIIV_API_KEY;
  const beehiivPub = process.env.BEEHIIV_PUBLICATION_ID;

  if (beehiivKey && beehiivPub) {
    try {
      const res = await fetch(
        `https://api.beehiiv.com/v2/publications/${beehiivPub}/subscriptions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${beehiivKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: contact.email,
            reactivate_existing: true,
            utm_source: contact.tags.find((t) => t.startsWith("utm_source:"))?.split(":")[1],
            custom_fields: [{ name: "kiwiz_tags", value: contact.tags.join(",") }],
          }),
        }
      );
      if (!res.ok) {
        console.warn("Beehiiv sync failed:", res.status, await res.text());
      }
    } catch (err) {
      console.warn("Beehiiv sync error:", err);
    }
    return;
  }

  // No ESP configured — DB-only mode. Nothing else to do.
}
