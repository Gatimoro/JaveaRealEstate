export default function MiralunaLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top triangle (pointing down) */}
      <path
        d="M 50 15 L 80 65 L 20 65 Z"
        fill="#f97316"
        stroke="none"
      />
      {/* Top inner triangle (white/hollow) */}
      <path
        d="M 50 30 L 70 60 L 30 60 Z"
        fill="white"
        stroke="none"
      />

      {/* Bottom triangle (pointing up) - reflected */}
      <path
        d="M 50 85 L 80 35 L 20 35 Z"
        fill="#f97316"
        stroke="none"
      />
      {/* Bottom inner triangle (white/hollow) */}
      <path
        d="M 50 70 L 70 40 L 30 40 Z"
        fill="white"
        stroke="none"
      />
    </svg>
  );
}
