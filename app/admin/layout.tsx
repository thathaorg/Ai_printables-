import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await isAdminSession())) {
    redirect("/admin-login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="ml-48 flex-1 overflow-y-auto p-6 pb-24">{children}</main>
    </div>
  );
}
