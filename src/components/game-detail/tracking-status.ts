import type { TrackingStatus } from "~/modules/library/model";

export const statuses: ReadonlyArray<{
  value: TrackingStatus;
  label: string;
  description: string;
}> = [
  { value: "backlog", label: "Da giocare", description: "È nella tua lista" },
  { value: "playing", label: "In corso", description: "Ci stai giocando" },
  { value: "completed", label: "Completato", description: "L'hai concluso" },
  { value: "abandoned", label: "Abbandonato", description: "Lo hai lasciato" },
];
export const isTrackingStatus = (value: string): value is TrackingStatus =>
  statuses.some((item) => item.value === value);
