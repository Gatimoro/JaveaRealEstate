export default function MiralunaLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 115"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <mask id="hourglass-mask">
          {/* White area = visible, black area = transparent cutout */}
          <rect width="100" height="115" fill="white" />
          {/* Bottom cutout triangle (black = creates transparency) */}
          <path d="M 31 100 L 69 100 L 50 69 Z" fill="black" />
          {/* Top cutout triangle (black = creates transparency) */}
          <path d="M 31 15 L 69 15 L 50 46 Z" fill="black" />
        </mask>
      </defs>

      {/* Filled hourglass with true transparent cutouts
          Outer triangles filled, inner triangles cut out for true transparency
          Perfectly centered and symmetric around y=57.5
      */}

      <g mask="url(#hourglass-mask)">
        {/* Bottom filled triangle (pointing up) */}
        <path
          d="M 14 112 L 86 112 L 50 48 Z"
          fill="#f97316"
        />

        {/* Top filled triangle (pointing down) */}
        <path
          d="M 14 3 L 86 3 L 50 67 Z"
          fill="#f97316"
        />
      </g>
    </svg>
  );
}
