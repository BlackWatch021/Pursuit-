export interface User {
  id: string;
  _id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "url"
  | "currency";

export interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: FieldType;
  options?: string[];
}

export interface Board {
  _id: string;
  userId: string;
  name: string;
  slug: string;
  color: string;
  stages: Stage[];
  customFields: CustomField[];
  titleLabel: string;
  dateLabel: string;
  itemLabel: string;
  showTags: boolean;
  showPriority: boolean;
  finalStageId?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Priority = "low" | "medium" | "high";

export interface Item {
  _id: string;
  boardId: string;
  userId: string;
  title: string;
  stageId: string;
  primaryDate: string;
  fields: Record<string, unknown>;
  tags: string[];
  priority: Priority;
  order: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = "created" | "note" | "stage_change" | "field_change" | "reminder";

export interface ItemRef {
  _id: string;
  title: string;
  boardId?: string;
}

export interface Activity {
  _id: string;
  itemId: string | ItemRef;
  userId: string;
  type: ActivityType;
  content?: string;
  fromStageId?: string;
  toStageId?: string;
  meta?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  _id: string;
  itemId: string | ItemRef;
  userId: string;
  dueDate: string;
  note: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FunnelStep {
  stageId: string;
  name: string;
  color: string;
  current: number;
}

export interface DashboardData {
  board: { id: string; name: string; stages: Stage[] };
  stats: {
    total: number;
    active: number;
    addedThisWeek: number;
    completionRate: number;
  };
  perStage: Record<string, number>;
  funnel: FunnelStep[];
  weeks: { week: string; count: number }[];
  reminders: Reminder[];
  recent: Activity[];
}

export interface CalendarEvent {
  id: string;
  type: "reminder";
  date: string;
  title: string;
  note: string;
  done: boolean;
}

export interface CalendarItem {
  id: string;
  title: string;
  stageId: string;
  primaryDate: string;
}

export interface CalendarActivity {
  id: string;
  type: ActivityType;
  content?: string;
  fromStageId?: string;
  toStageId?: string;
  meta?: unknown;
  itemTitle: string;
  itemId: string | null;
  createdAt: string;
}

export interface CalendarData {
  year: number;
  stages: Stage[];
  heatmap: { date: string; count: number }[];
  items: CalendarItem[];
  events: CalendarEvent[];
  recent: CalendarActivity[];
}
