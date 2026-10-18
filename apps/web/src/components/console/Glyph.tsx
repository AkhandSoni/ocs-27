import {
  Blocks,
  ScanSearch,
  UsersRound,
  PenTool,
  Braces,
  Library,
  Gamepad2,
  CircleUserRound,
} from "lucide-react";
import type { ExperienceId } from "./content";

// One icon family, one optical size and stroke weight throughout the console.
const icons = {
  tech: Blocks,
  research: ScanSearch,
  management: UsersRound,
  design: PenTool,
  cc: Braces,
  showcase: Library,
  arcade: Gamepad2,
  applications: CircleUserRound,
};
export default function Glyph({
  id,
  className,
}: {
  id: ExperienceId;
  className?: string;
}) {
  const Icon = icons[id];
  return <Icon className={className} strokeWidth={1.5} aria-hidden="true" />;
}
