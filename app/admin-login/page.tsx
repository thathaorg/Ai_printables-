"use client";

import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function AdminLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/admin/cms";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");
      router.replace(next.startsWith("/admin") ? next : "/admin/cms");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-[1.75rem] bg-white p-8 shadow-lg ring-1 ring-black/5">
        <div className="mb-6 flex justify-center">
          <BrandLogo href="/" size={44} />
        </div>
        <h1 className="text-center font-display text-2xl font-bold text-[var(--ink)]">
          Admin access
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--ink-soft)]">
          Enter the <code className="rounded bg-muted px-1">ADMIN_PASSWORD</code> from your
          environment.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="h-12 rounded-full border-2 px-4"
            autoFocus
          />
          {error && <p className="text-center text-sm text-[var(--coral)]">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Checking…" : "Continue"}
          </Button>
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
