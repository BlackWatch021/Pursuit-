import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose';

export const PRIORITIES = ['low', 'medium', 'high'] as const;

const itemSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    stageId: { type: String, required: true },
    primaryDate: { type: Date, default: Date.now },
    // Custom field values keyed by Board.customFields[].id
    fields: { type: Schema.Types.Mixed, default: {} },
    tags: { type: [String], default: [] },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    order: { type: Number, default: 0 },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

itemSchema.index({ userId: 1, primaryDate: 1 });
itemSchema.index({ boardId: 1, stageId: 1, order: 1 });

export type ItemDoc = HydratedDocument<InferSchemaType<typeof itemSchema>>;
export const Item = model('Item', itemSchema);
