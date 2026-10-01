import type { LibraryFilters, TrackingStatus } from "~/modules/library/model";

export const statuses: ReadonlyArray<{
  value: TrackingStatus | "all";
  label: string;
}> = [
  { value: "all", label: "Tutti" },
  { value: "playing", label: "In corso" },
  { value: "backlog", label: "Da giocare" },
  { value: "completed", label: "Completati" },
  { value: "abandoned", label: "Abbandonati" },
];
export const statusLabels: Record<TrackingStatus, string> = {
  playing: "In corso",
  backlog: "Da giocare",
  completed: "Completato",
  abandoned: "Abbandonato",
};
export type Sort = NonNullable<LibraryFilters["sort"]>;
export const sortLabels: Record<Sort, string> = {
  updated: "Modificati di recente",
  title: "Titolo A–Z",
  rating: "Voto più alto",
  releaseDate: "Uscita più recente",
};

export const isSort = (value: unknown): value is Sort =>
  typeof value === "string" && Object.hasOwn(sortLabels, value);
