import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function NewsletterAdminPage() {
  const result = await requireAdmin();

  if ("context" in result && result.context) {
    const { prisma } = result.context;

    const subs = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
          <Link
            href="/admin/newsletter/export"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Download CSV
          </Link>
        </div>
        <ul className="space-y-2">
          {subs.map((subscriber) => (
            <li key={subscriber.id} className="p-3 border rounded-lg bg-card">
              <div className="font-medium text-foreground">{subscriber.email}</div>
              <div className="text-xs text-muted-foreground">
                Subscribed {subscriber.createdAt.toISOString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  redirect("/admin-login");
}