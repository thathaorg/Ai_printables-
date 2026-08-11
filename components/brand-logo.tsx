import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function BrandLogo({
  href = "/",
  size = 36,
  showWordmark = true,
  className,
}: {
  href?: string | null;
  size?: number;
  showWordmark?: boolean;
  className?: string;
}) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2 group", className)}>
      <Image
        src="/brand/logo.svg"
        alt=""
        width={size}
        height={size}
        className="drop-shadow-sm transition-transform duration-200 group-hover:rotate-[-6deg] group-hover:scale-105"
        priority
      />
      {showWordmark && (
        <span className="font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
          KI<span className="text-[var(--kiwi)]">WIZ</span>
        </span>
      )}
    </span>
  );

  if (href == null || href === "") return inner;
  return (
    <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kiwi)] rounded-lg">
      {inner}
    </Link>
  );
}
