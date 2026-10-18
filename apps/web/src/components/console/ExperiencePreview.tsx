import {
  domainById,
  experienceOrder,
  experiences,
  type ExperienceId,
} from "./content";
import type { DomainId } from "@/lib/recruitment";
import Glyph from "./Glyph";

/** A software identifier and its contents, not decorative background artwork. */
export default function ExperiencePreview({ id }: { id: ExperienceId }) {
  const domain = domainById[id as DomainId];
  const entries =
    domain?.areas ??
    (
      {
        showcase: [
          "Chapter projects",
          "Events & activities",
          "Public source references",
        ],
        arcade: ["Signal / Snake", "Single player", "Local high score"],
        applications: [
          "Student profile",
          "Saved applications",
          "Local progress",
        ],
      } as Record<string, string[]>
    )[id];
  return (
    <aside
      className="experience-preview"
      key={id}
      aria-label="Selected software contents"
    >
      <div className="software-mark">
        <Glyph id={id} />
      </div>
      <div className="software-index">
        <span>
          {domain ? "DOMAIN" : "APPLICATION"}{" "}
          {String(experienceOrder.indexOf(id) + 1).padStart(2, "0")}
        </span>
        <span>OCS ’27</span>
      </div>
      <ul>
        {entries.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>
      <small>
        {domain
          ? "Explore the domain, then begin your application."
          : experiences[id].category.split(" · ")[0]}
      </small>
    </aside>
  );
}
