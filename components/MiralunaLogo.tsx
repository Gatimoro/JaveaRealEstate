export default function MiralunaLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top triangle (pointing down) - tip at top, base at middle */}
      <path
        d="M 50 20 L 80 50 L 20 50 Z"
        fill="#f97316"
        stroke="none"
      />
      {/* Top inner triangle (white/hollow) */}
      <path
        d="M 50 32 L 68 50 L 32 50 Z"
        fill="white"
        stroke="none"
      />

      {/* Bottom triangle (pointing up) - base at middle, tip at bottom */}
      <path
        d="M 20 50 L 80 50 L 50 80 Z"
        fill="#f97316"
        stroke="none"
      />
      {/* Bottom inner triangle (white/hollow) */}
      <path
        d="M 32 50 L 68 50 L 50 68 Z"
        fill="white"
        stroke="none"
      />
    </svg>
  );
}
