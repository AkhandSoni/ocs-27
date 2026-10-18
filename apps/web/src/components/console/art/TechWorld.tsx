type BlockProps = {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  top?: string;
  left?: string;
  right?: string;
};
/** Orthographic construction kit: every machine shares the same projection. */
function Block({
  x,
  y,
  w,
  d,
  h,
  top = "#a5b0ad",
  left = "#637578",
  right = "#33494e",
}: BlockProps) {
  return (
    <g stroke="#172d33" strokeWidth="3" strokeLinejoin="round">
      <path
        d={`M${x - w / 2} ${y - h} ${x} ${y - h - d / 2} ${x + w / 2} ${y - h} ${x} ${y - h + d / 2}Z`}
        fill={top}
      />
      <path
        d={`M${x - w / 2} ${y - h} ${x} ${y - h + d / 2}V${y + d / 2}L${x - w / 2} ${y}Z`}
        fill={left}
      />
      <path
        d={`M${x} ${y - h + d / 2} ${x + w / 2} ${y - h}V${y}L${x} ${y + d / 2}Z`}
        fill={right}
      />
    </g>
  );
}
export default function TechWorld() {
  return (
    <>
      <path fill="#243b40" d="M0 0h1600v900H0z" />
      <path fill="#304a4c" d="m660 535 560-325 640 375v315H660z" />
      <g stroke="#526867" strokeWidth="2" opacity=".5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`m${650 + i * 145} 900 690-400M${600 + i * 150} 330l800 465`}
          />
        ))}
      </g>
      {/* Raised shop floor, connected conveyor and a material loading bay. */}
      <Block
        x={1180}
        y={680}
        w={690}
        d={400}
        h={32}
        top="#a4a996"
        left="#747f73"
        right="#465d58"
      />
      <path
        d="m850 576 250 145 95-56-250-145Z"
        fill="#243b40"
        stroke="#d0af6e"
        strokeWidth="8"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={`m${875 + i * 36} ${571 + i * 21} 53 30`}
          stroke="#73807a"
          strokeWidth="6"
        />
      ))}
      <Block
        x={940}
        y={580}
        w={53}
        d={34}
        h={29}
        top="#dbb36f"
        left="#ad793e"
        right="#795536"
      />
      <Block
        x={1020}
        y={627}
        w={53}
        d={34}
        h={29}
        top="#dbb36f"
        left="#ad793e"
        right="#795536"
      />
      <Block
        x={1140}
        y={690}
        w={90}
        d={55}
        h={170}
        top="#d5b574"
        left="#b47d42"
        right="#805b36"
      />
      <Block
        x={1305}
        y={595}
        w={90}
        d={55}
        h={170}
        top="#d5b574"
        left="#b47d42"
        right="#805b36"
      />
      <path
        d="m1100 517 206-119 42 25-207 120Z"
        fill="#dfbf7e"
        stroke="#172d33"
        strokeWidth="4"
      />
      <path d="m1141 543 207-120v30l-207 120Z" fill="#9a703f" />
      {/* Suspended assembly head is attached to its gantry, not a floating prop. */}
      <path d="M1234 470v85" stroke="#253b3e" strokeWidth="13" />
      <Block
        x={1234}
        y={574}
        w={63}
        d={40}
        h={43}
        top="#d2d5c2"
        left="#899b91"
        right="#4d6c68"
      />
      <Block
        x={1234}
        y={650}
        w={140}
        d={85}
        h={36}
        top="#627e79"
        left="#365752"
        right="#223f40"
      />
      <Block
        x={1234}
        y={617}
        w={72}
        d={44}
        h={36}
        top="#d8dfc9"
        left="#9cac99"
        right="#64877b"
      />
      <g stroke="#20383b" strokeWidth="5" fill="#889a89">
        <path d="m1335 498 110 63v120l-110-63Z" />
        <path d="m1335 498 72-42 110 63-72 42Z" fill="#c5c9ad" />
        <path d="m1445 561 72-42v120l-72 42Z" fill="#526e66" />
      </g>
      <path d="m1360 537 61 35v49l-61-35Z" fill="#233f42" />
      <path
        d="m1370 558 12 7m12 7 12 7m-36-2 36 21"
        stroke="#d2b06c"
        strokeWidth="5"
      />
      <path d="m1410 679 48 28-65 38-49-28Z" fill="#d2ac67" />
      <Block
        x={1030}
        y={463}
        w={116}
        d={72}
        h={70}
        top="#617d75"
        left="#41615b"
        right="#263f40"
      />
      <path d="m990 435 28 16m-28-3 28 16" stroke="#bed0ba" strokeWidth="5" />
      <path
        d="m941 743 235 137 330-191"
        fill="none"
        stroke="#b1b69b"
        strokeWidth="3"
      />
    </>
  );
}
