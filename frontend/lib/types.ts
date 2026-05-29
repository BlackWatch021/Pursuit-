export interface User {
  id: string;
  _id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export type FieldType = "text" | "number" | "date" | "select" | "url" | "currency";

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
  reached: number;
}

export interface DashboardData {
  board: { id: string; name: string; stages: Stage[] };
  stats: {
    total: number;
    active: number;
    responseRate: number;
    interviewRate: number;
    offerRate: number;
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

export interface CalendarData {
  year: number;
  heatmap: { date: string; count: number }[];
  events: CalendarEvent[];
}
