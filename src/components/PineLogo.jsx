// PineLogo — minimal stylized pine tree: three stacked triangular tiers and
// a short trunk. No leaves, no branches, no gradients. Uses currentColor so
// it can be dropped anywhere and colored via className (e.g. "text-ink").
export default function PineLogo({ className = "w-6 h-6", ariaLabel = "Pine" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
      role="img"
      aria-label={ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="45" y="82" width="10" height="12" />
      <polygon points="15,80 85,80 50,54" />
      <polygon points="21,58 79,58 50,33" />
      <polygon points="27,37 73,37 50,12" />
    </svg>
  );
}
