import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose';

const reminderSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dueDate: { type: Date, required: true },
    note: { type: String, default: '' },
    done: { type: Boolean, default: false },
    // How long BEFORE dueDate to email (minutes). 0 = at the due time.
    leadMinutes: { type: Number, default: 0 },
    // When the email should fire = dueDate - leadMinutes. Kept in sync below so
    // the scheduler can query it directly (indexed). Recomputed on every save.
    notifyAt: { type: Date, index: true },
    // Set once a "reminder due" email has been sent, so we never email twice.
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Keep notifyAt = dueDate - leadMinutes in sync on every create/save.
reminderSchema.pre('save', function (next) {
  const lead = this.leadMinutes || 0;
  this.notifyAt = new Date(new Date(this.dueDate).getTime() - lead * 60_000);
  next();
});

reminderSchema.index({ userId: 1, dueDate: 1 });

export type ReminderDoc = HydratedDocument<InferSchemaType<typeof reminderSchema>>;
export const Reminder = model('Reminder', reminderSchema);
