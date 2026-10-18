/** A planar route-planning world. Routes end at stations; each crossing is deliberate. */
export default function ManagementWorld() {
  const stations = [
    [825, 300],
    [1020, 300],
    [1180, 460],
    [1410, 460],
    [1450, 670],
    [1260, 750],
    [1020, 670],
    [845, 570],
    [1180, 240],
    [1390, 250],
  ];
  return (
    <>
      <path fill="#ece4cf" d="M0 0h1600v900H0z" />
      <path
        d="M1070-40c-130 180-90 245 65 355s185 199 65 307-126 181-35 320"
        fill="none"
        stroke="#9ebdc2"
        strokeWidth="124"
      />
      <g fill="#dcd5c1">
        <path d="M740 375h140v84H740Zm90-210h92v65h-92Zm448 174h126v47h-126Zm100 210h142v64h-142Zm-510 129h86v81h-86Zm410 117h93v70h-93Z" />
      </g>
      {/* Bridges are the only places where routes cross the river. */}
      <g fill="none" stroke="#c3bcaa" strokeWidth="33">
        <path d="m1070 350 110 110m-77 205 140 46" />
      </g>
      <g
        fill="none"
        strokeWidth="16"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path
          d="M825 300h195l160 160h230l40 40v170l-80 80h-110"
          stroke="#bd513d"
        />
        <path d="M845 570v100h175l160-160V240" stroke="#3d6b88" />
        <path d="M845 570h235l100-110 210-210" stroke="#ba913e" />
      </g>
      <g fill="#f8f3e5" stroke="#2c3538" strokeWidth="7">
        {stations.map(([x, y], i) =>
          i === 2 ? (
            <rect key={i} x={x - 22} y={y - 22} width="44" height="44" />
          ) : i === 6 || i === 9 ? (
            <path key={i} d={`m${x} ${y - 23} 24 41h-48Z`} />
          ) : (
            <circle key={i} cx={x} cy={y} r="18" />
          ),
        )}
      </g>
      <g stroke="#ece4cf" strokeWidth="3" fill="#2d414d">
        <rect x="932" y="288" width="54" height="24" rx="3" fill="#bd513d" />
        <rect x="1168" y="323" width="24" height="54" rx="3" fill="#3d6b88" />
        <rect x="928" y="558" width="54" height="24" rx="3" fill="#ba913e" />
      </g>
      <g fill="#2c3538">
        <circle cx="1020" cy="300" r="7" />
        <circle cx="1410" cy="460" r="7" />
        <circle cx="1260" cy="750" r="7" />
      </g>
      <path d="M750 825h700" stroke="#c5bda9" strokeWidth="2" />
      <g fill="#b6ad97">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <rect
            key={i}
            x={750 + i * 55}
            y="825"
            width="2"
            height={i % 3 === 0 ? 16 : 8}
          />
        ))}
      </g>
    </>
  );
}
