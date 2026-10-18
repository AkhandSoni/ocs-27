function PaperTree({
  x,
  y,
  scale = 1,
}: {
  x: number;
  y: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-8 0h16v-115H-8Z" fill="#b66a45" />
      <path d="m0-235-83 100 22 70L0-31l61-34 22-70Z" fill="#3b7a70" />
      <path d="m0-235 83 100-22 70L0-31Z" fill="#245d56" />
      <path d="M0-235V-31" stroke="#84b19a" strokeWidth="3" />
    </g>
  );
}
export default function DesignWorld() {
  return (
    <>
      <path fill="#e8d8b9" d="M0 0h1600v900H0z" />
      <path
        fill="#efb17e"
        d="m600 600 330-258 270 142 213-204 187 163v457H600Z"
      />
      <path fill="#cc7157" d="m930 342 270 142-169 190-101-159Z" />
      <path fill="#f4c89b" d="m1200 484 213-204-88 341Z" />
      <path fill="#aac2a5" d="m620 900 255-265 269 50 176-122 280 167v170Z" />
      <path fill="#5b9283" d="m875 635 56 186-36 79H620Z" />
      <path fill="#d2d5ac" d="m1144 685 176-122-65 220Z" />
      {/* Folded bridge: crease lines follow actual plane boundaries. */}
      <path d="m960 745 296-99 31 52-296 108Z" fill="#faf0d4" />
      <path d="m991 806 296-108-6 28-283 104Z" fill="#b5ac8b" />
      <path
        d="m1015 727 29 59m29-80 30 58m30-78 30 58m30-78 29 56"
        stroke="#d4c7a4"
        strokeWidth="3"
      />
      <PaperTree x={920} y={701} scale={0.8} />
      <PaperTree x={1460} y={821} scale={1.2} />
      <PaperTree x={1394} y={724} scale={0.67} />
      {/* Paper protagonist: one folded bird, with a connected wing and beak. */}
      <path d="m1100 560 164-86-29 97-78 40Z" fill="#faf0d4" />
      <path d="m1157 611 78-40 100 43-56 48Z" fill="#dd9a54" />
      <path d="m1235 571 82-122 18 165Z" fill="#cf684e" />
      <path d="m1317 449 41 35-23 130Z" fill="#a7463d" />
      <path d="m1264 474-29 97-135-11Z" fill="#d8c9a5" />
      <path d="m1279 662 56-48 57 9-63 20Z" fill="#f4d58a" />
      <path d="m1100 560-60-14 117 65Z" fill="#ba533f" />
      <path d="m1217 639-13 31m35-21-10 31" stroke="#7c4f3b" strokeWidth="6" />
      <circle cx="1305" cy="619" r="5" fill="#4b4233" />
      {/* A cut-paper house anchors the world beyond the protagonist. */}
      <path d="m1010 590 75-36 64 37-75 38Z" fill="#efce91" />
      <path d="m1010 590 64 39v80l-64-35Z" fill="#b66c4b" />
      <path d="m1074 629 75-38v79l-75 39Z" fill="#8a4c3e" />
      <path d="m997 590 87-111 80 115-80-39Z" fill="#4b7d71" />
      <path d="m1084 479 80 115-80-39Z" fill="#2b6058" />
      <path d="m1090 658 25-12v34l-25 13Z" fill="#eacb8b" />
      <path d="m756 861 180 39H650Z" fill="#35796b" />
    </>
  );
}
