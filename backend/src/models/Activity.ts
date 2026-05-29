import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose';

export const ACTIVITY_TYPES = ['created', 'note', 'stage_change', 'field_change', 'reminder'] as const;

const activitySchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    content: { type: String },
    fromStageId: { type: String },
    toStageId: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export type ActivityDoc = HydratedDocument<InferSchemaType<typeof activitySchema>>;
export const Activity = model('Activity', activitySchema);
