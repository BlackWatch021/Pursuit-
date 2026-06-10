import { Router } from 'express';
import { HttpError } from '../middleware/error';
import { Item } from '../models/Item';
import { Reminder } from '../models/Reminder';
import { asyncHandler } from '../utils/asyncHandler';
import { createReminderSchema, updateReminderSchema } from '../validators/schemas';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { itemId, scope } = req.query as Record<string, string>;
    const query: Record<string, unknown> = { userId: req.userId };
    if (itemId) query.itemId = itemId;
    if (scope === 'open') query.done = false;
    const reminders = await Reminder.find(query)
      .sort({ dueDate: 1 })
      .populate('itemId', 'title boardId');
    res.json({ reminders });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createReminderSchema.parse(req.body);
    const item = await Item.findOne({ _id: data.itemId, userId: req.userId }).select('_id');
    if (!item) throw new HttpError(404, 'Item not found');
    const reminder = await Reminder.create({
      itemId: item._id,
      userId: req.userId,
      dueDate: data.dueDate,
      note: data.note ?? '',
      leadMinutes: data.leadMinutes ?? 0,
    });
    res.status(201).json({ reminder });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateReminderSchema.parse(req.body);
    // Load + save (not findOneAndUpdate) so the pre-save hook recomputes notifyAt
    // when the due date or lead time changes.
    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.userId });
    if (!reminder) throw new HttpError(404, 'Reminder not found');
    if (data.dueDate !== undefined) reminder.dueDate = data.dueDate;
    if (data.note !== undefined) reminder.note = data.note;
    if (data.done !== undefined) reminder.done = data.done;
    if (data.leadMinutes !== undefined) reminder.leadMinutes = data.leadMinutes;
    await reminder.save();
    res.json({ reminder });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!reminder) throw new HttpError(404, 'Reminder not found');
    res.json({ ok: true });
  }),
);

export default router;
