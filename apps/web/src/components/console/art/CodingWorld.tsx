const map = [
  "##############",
  "#....#.......#",
  "#....#..##...#",
  "#.......#....#",
  "###.##..#....#",
  "#...#...###..#",
  "#...#........#",
  "#.......#....#",
  "#..###..#....#",
  "#....#..#....#",
  "#....#.......#",
  "##############",
];
/** Integer-grid puzzle art, intentionally independent of the illustrated worlds. */
function Room({
  x,
  y,
  size = 1,
  nested = false,
}: {
  x: number;
  y: number;
  size?: number;
  nested?: boolean;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${size})`}
      shapeRendering="crispEdges"
    >
      <rect width="588" height="504" fill="#2d233e" />
      {map.map((row, y) =>
        Array.from(row).map((tile, x) =>
          tile === "#" ? (
            <g key={`${x}-${y}`}>
              <rect
                x={x * 42}
                y={y * 42}
                width="42"
                height="42"
                fill="#8e78b1"
              />
              <rect
                x={x * 42}
                y={y * 42}
                width="42"
                height="6"
                fill="#b5a2cb"
              />
              <rect
                x={x * 42 + 35}
                y={y * 42 + 6}
                width="7"
                height="36"
                fill="#665482"
              />
            </g>
          ) : null,
        ),
      )}
      <path
        d="M105 315h84v-84h126v-84h168"
        stroke="#4c3d60"
        strokeWidth="5"
        fill="none"
        strokeDasharray="8 8"
      />
      <rect x="86" y="296" width="38" height="38" fill="#e5b768" />
      <path d="m96 305 17 10-17 10Z" fill="#3c2c43" />
      <rect
        x="466"
        y="130"
        width="32"
        height="32"
        fill="none"
        stroke="#afc7a5"
        strokeWidth="5"
      />
      <path d="m482 137 9 9-9 9-9-9Z" fill="#afc7a5" />
      <rect x="296" y="296" width="38" height="38" fill="#afc7a5" />
      <path
        d="M302 302h26v26h-26Z"
        stroke="#57634f"
        strokeWidth="4"
        fill="none"
      />
      {!nested && (
        <>
          <rect
            x="373"
            y="338"
            width="174"
            height="132"
            fill="#192b31"
            stroke="#c7d5b4"
            strokeWidth="9"
          />
          <Room x={382} y={346} size={0.26} nested />
        </>
      )}
    </g>
  );
}
export default function CodingWorld() {
  return (
    <>
      <path fill="#261e33" d="M0 0h1600v900H0z" />
      <path fill="#382b48" d="M780 156h700v644H780z" />
      <path fill="#1c1928" d="m780 800 45 42h700V198l-45-42v644Z" />
      <Room x={835} y={220} />
      <g fill="#77668a">
        <path d="M815 175h14v14h-14Zm613 0h14v14h-14ZM815 762h14v14h-14Zm613 0h14v14h-14Z" />
      </g>
    </>
  );
}
