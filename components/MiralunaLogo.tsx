export default function MiralunaLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 115"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Equilateral triangles forming hourglass
          For equilateral: height = base × √3/2 ≈ base × 0.866
          Base width: 64 units → Height: ~55.4 units
          Thicker stroke with minimal inner gap for bold appearance
      */}

      {/* Bottom triangle (pointing up) - equilateral */}
      <path
        d="M 18 110 L 82 110 L 50 58.5 Z"
        fill="none"
        stroke="#f97316"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top triangle (pointing down) - equilateral */}
      <path
        d="M 18 5 L 82 5 L 50 56.5 Z"
        fill="none"
        stroke="#f97316"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
