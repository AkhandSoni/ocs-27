function Pine({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-7 0h14v-90H-7Z" fill="#203c3b" />
      <path d="m0-220-58 110h25l-48 77h162l-48-77h25Z" fill="#254640" />
      <path d="M0-220V-33H81l-48-77h25Z" fill="#1b3435" />
    </g>
  );
}
export default function ResearchWorld() {
  return (
    <>
      <path fill="#1e3038" d="M0 0h1600v900H0z" />
      <path fill="#ba7052" d="M0 315h1600v585H0z" />
      <circle cx="1270" cy="265" r="167" fill="#e3c891" />
      <path
        d="M1370 132a167 167 0 0 1-170 277 165 165 0 0 0 67-286Z"
        fill="#d1aa73"
      />
      <path
        d="M590 570C735 565 780 348 875 330c62 0 62 150 145 153 95 0 134-115 208-53 102 85 127 169 240 25 47-22 90 54 132 102v343H590Z"
        fill="#82594a"
      />
      <path
        d="M715 633c124-59 145-185 215-172 85 8 91 108 147 83 75-70 102-66 175-7 64 52 111 126 169 101l179-47v309H715Z"
        fill="#4d5550"
      />
      <path
        d="M530 781c181-116 207-243 357-164l133 62c83-35 119-138 190-167 127 33 211 153 390 227v161H530Z"
        fill="#2e4541"
      />
      <path d="m950 900 157-149 176-18 126 167" fill="#557169" />
      <path d="m1265 734-89 166h-50l103-164Z" fill="#b69e73" />
      <Pine x={922} y={737} scale={0.85} />
      <Pine x={1520} y={820} scale={1.2} />
      <Pine x={1473} y={761} scale={0.66} />
      {/* Expedition camp, observer and telescope all stand on the same ridge. */}
      <ellipse cx="1216" cy="705" rx="45" ry="8" fill="#203936" />
      <ellipse cx="1304" cy="679" rx="57" ry="8" fill="#203936" />
      <path d="m1002 758 65-113 76 124Z" fill="#d89a56" />
      <path d="m1067 645 3 116 73 8Z" fill="#a9693f" />
      <path d="m1010 758 55-85-15 90Z" fill="#2a3936" />
      <path d="m1183 650 19-81 22 14 13 66Z" fill="#d9c4a0" />
      <path d="m1202 569 8-28 26 3 6 28-18 11Z" fill="#b9875e" />
      <path
        d="m1203 652-12 50m33-50 19 41"
        stroke="#1b3034"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="m1222 592 27 19 33-26"
        fill="none"
        stroke="#d9c4a0"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <g stroke="#183339" strokeLinejoin="round">
        <path d="m1267 555 67-35 17 34-67 34Z" fill="#ccab76" strokeWidth="7" />
        <path d="m1261 564 17-9 17 34-17 9Z" fill="#607b71" strokeWidth="5" />
        <path d="m1310 573-12 102m12-102 45 90m-45-90-49 87" strokeWidth="7" />
      </g>
      <path d="m790 818 158 82H650Z" fill="#192f32" />
      <path d="m1468 825 132-27v102h-255Z" fill="#192f32" />
    </>
  );
}
