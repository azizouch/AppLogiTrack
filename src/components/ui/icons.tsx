import { LucideProps } from "lucide-react";

export function ScanRetourIcon({
  className,
  size = 24,
  ...props
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* 🔁 BIG refresh */}
      <path
        d="M3 3v6h6M21 21v-6h-6M21 9a9 9 0 0 0-16-5L3 9m18 6a9 9 0 0 1-16 5l-2-5"
        strokeWidth="2.6"
      />

      {/* 📦 QR CODE (scaled down & centered) */}
      <g transform="translate(2,2) scale(0.85)">
        <rect width="5" height="5" x="3" y="3" rx="1" />
        <rect width="5" height="5" x="16" y="3" rx="1" />
        <rect width="5" height="5" x="3" y="16" rx="1" />
        <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
        <path d="M21 21v.01" />
        <path d="M12 7v3a2 2 0 0 1-2 2H7" />
        <path d="M3 12h.01" />
        <path d="M12 3h.01" />
        <path d="M12 16v.01" />
        <path d="M16 12h1" />
        <path d="M21 12v.01" />
        <path d="M12 21v-1" />
      </g>
    </svg>
  );
}