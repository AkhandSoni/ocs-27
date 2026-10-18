/** Official chapter lockup, preserved from ACM-VIT's previous OCS repository. */
export default function BrandMark({ className }: { className?: string }) {
  return (
    <img
      className={className ?? "acm-brand"}
      src="/ocs/logo.svg"
      width={183}
      height={66}
      alt="ACM-VIT student chapter"
      draggable={false}
    />
  );
}
