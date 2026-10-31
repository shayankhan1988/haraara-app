"use client";

import { useState } from "react";

export function CouponCode({ code, labels }: { code: string; labels: { copyCode: string; copied: string } }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {}
      }}
      className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-brand-500 bg-brand-50 px-3 py-1.5 text-sm"
      title={labels.copyCode}
    >
      <code className="font-mono font-bold tracking-wider text-brand-700" dir="ltr">{code}</code>
      <span className="text-xs text-brand-700">{copied ? labels.copied : labels.copyCode}</span>
    </button>
  );
}
