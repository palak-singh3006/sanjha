"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

export function QrCode({ value, size = 180 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const opts = useMemo(
    () => ({
      errorCorrectionLevel: "M" as const,
      margin: 1,
      width: size,
      scale: 4,
      type: "image/png" as const,
    }),
    [size],
  );

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, opts).then((url) => {
      if (cancelled) return;
      setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, opts]);

  if (!dataUrl) {
    return (
      <div
        className="grid place-items-center rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 text-xs text-[var(--foreground)]/60"
        style={{ width: size, height: size }}
      >
        QR…
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR code"
      width={size}
      height={size}
      className="rounded-xl border border-[var(--foreground)]/10 bg-white/[0.03]"
    />
  );
}

