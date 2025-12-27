export default function MiralunaLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 115"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Filled hourglass with cutout triangle
          Two large filled triangles (2n size) with a larger centered triangle (n size) cut out
          Cutout triangles are centered and don't touch at the middle
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

      {/* Bottom cutout triangle - larger and centered, apex at y=62 */}
      <path
        d="M 35 92 L 65 92 L 50 62 Z"
        fill="#0a0a0a"
      />

      {/* Top cutout triangle - larger and centered, apex at y=53 */}
      <path
        d="M 35 23 L 65 23 L 50 53 Z"
        fill="#0a0a0a"
      />
    </svg>
  );
}
