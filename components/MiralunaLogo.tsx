export default function MiralunaLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 115"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Filled hourglass with cutout triangle
          Two large filled triangles (2n size) with a smaller triangle (n size) cut out from center
      */}

      {/* Bottom filled triangle (pointing up) - size 2n */}
      <path
        d="M 14 112 L 86 112 L 50 48 Z"
        fill="#f97316"
      />

      {/* Top filled triangle (pointing down) - size 2n */}
      <path
        d="M 14 3 L 86 3 L 50 67 Z"
        fill="#f97316"
      />

      {/* Center cutout triangle - size n - creates the hole */}
      <path
        d="M 38 84 L 62 84 L 50 57.5 Z"
        fill="#0a0a0a"
      />
      <path
        d="M 38 31 L 62 31 L 50 57.5 Z"
        fill="#0a0a0a"
      />
    </svg>
  );
}
