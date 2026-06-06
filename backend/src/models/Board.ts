import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose';

export const FIELD_TYPES = ['text', 'number', 'date', 'select', 'multiselect', 'url', 'currency'] as const;

const stageSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    order: { type: Number, required: true },
    color: { type: String, required: true },
  },
  { _id: false },
);

const fieldSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: FIELD_TYPES, required: true },
    options: { type: [String], default: undefined },
  },
  { _id: false },
);

const boardSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    color: { type: String, default: '#6366F1' },
    stages: { type: [stageSchema], default: [] },
    customFields: { type: [fieldSchema], default: [] },
    // Per-board labels for the built-in title/date fields + opt-in/out of the
    // built-in tags/priority. Generic defaults so non-job boards read naturally.
    titleLabel: { type: String, default: 'Title' },
    dateLabel: { type: String, default: 'Date' },
    itemLabel: { type: String, default: 'Item' },
    showTags: { type: Boolean, default: true },
    showPriority: { type: Boolean, default: true },
    // Stage that represents "done" — drives the dashboard completion/active stats.
    // Falls back to the last stage by order when unset.
    finalStageId: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type BoardDoc = HydratedDocument<InferSchemaType<typeof boardSchema>>;
export const Board = model('Board', boardSchema);
