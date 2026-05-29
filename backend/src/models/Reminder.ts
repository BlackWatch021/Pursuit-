import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose';

const reminderSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dueDate: { type: Date, required: true },
    note: { type: String, default: '' },
    done: { type: Boolean, default: false },
  },
  { timestamps: true },
);

reminderSchema.index({ userId: 1, dueDate: 1 });

export type ReminderDoc = HydratedDocument<InferSchemaType<typeof reminderSchema>>;
export const Reminder = model('Reminder', reminderSchema);
