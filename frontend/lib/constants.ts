import type { FieldType } from "@/lib/types";

export const FIELD_TYPE_VALUES: FieldType[] = [
  "text",
  "number",
  "date",
  "select",
  "multiselect",
  "url",
  "currency",
];

/** Friendly labels for field types (Settings dropdown). */
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  select: "Select (one)",
  multiselect: "Multi-select",
  url: "URL",
  currency: "Currency",
};
