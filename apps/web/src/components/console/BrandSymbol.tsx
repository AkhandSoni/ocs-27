/** The diamond from the official chapter lockup, cropped without redrawing it. */
export default function BrandSymbol({ className = "acm-symbol" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 66 66" role="img" aria-label="ACM-VIT">
      <image href="/ocs/logo.svg" width="183" height="66" />
    </svg>
  );
}
