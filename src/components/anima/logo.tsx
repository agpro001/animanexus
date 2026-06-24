export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="anima-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.85 0.18 200)" />
          <stop offset="60%" stopColor="oklch(0.75 0.24 300)" />
          <stop offset="100%" stopColor="oklch(0.8 0.2 165)" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="13" stroke="url(#anima-g)" strokeWidth="1.6" opacity="0.5" />
      <circle cx="16" cy="16" r="8" stroke="url(#anima-g)" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="3" fill="url(#anima-g)" />
      <circle cx="3" cy="16" r="1.4" fill="oklch(0.85 0.18 200)" />
      <circle cx="29" cy="16" r="1.4" fill="oklch(0.75 0.24 300)" />
      <circle cx="16" cy="3" r="1.4" fill="oklch(0.8 0.2 165)" />
      <circle cx="16" cy="29" r="1.4" fill="oklch(0.84 0.18 80)" />
    </svg>
  );
}