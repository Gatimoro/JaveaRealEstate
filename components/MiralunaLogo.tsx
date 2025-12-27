export default function MiralunaLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bottom triangle (pointing up) - base at bottom, tip touches middle */}
      <path
        d="M 25 75 L 75 75 L 50 50 Z"
        fill="none"
        stroke="#f97316"
        strokeWidth="3"
      />

      {/* Top triangle (pointing down) - base at top, tip touches middle */}
      <path
        d="M 25 25 L 75 25 L 50 50 Z"
        fill="none"
        stroke="#f97316"
        strokeWidth="3"
      />
    </svg>
  );
}
