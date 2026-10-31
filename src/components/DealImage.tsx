/* eslint-disable @next/next/no-img-element */
export function DealImage({ src, alt, size }: { src: string | null; alt: string; size: number }) {
  const style = { width: size, height: size };
  if (!src) {
    return (
      <div style={style} className="grid place-items-center rounded-lg bg-gray-100 text-3xl font-bold text-gray-300" aria-hidden>
        {(alt.replace(/^\[[^\]]*\]\s*/, "").match(/[\p{L}\p{N}]/u)?.[0] ?? "°").toUpperCase()}
      </div>
    );
  }
  // Externe afbeeldingen van winkels: gewone <img> zodat we geen domeinlijst hoeven bij te houden.
  return <img src={src} alt={alt} style={style} loading="lazy" referrerPolicy="no-referrer" className="rounded-lg bg-white object-contain" />;
}
