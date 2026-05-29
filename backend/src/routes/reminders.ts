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
    const reminders = await Reminder.find(query).sort({ dueDate: 1 }).populate('itemId', 'title');
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
    });
    res.status(201).json({ reminder });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateReminderSchema.parse(req.body);
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      data,
      { new: true },
    );
    if (!reminder) throw new HttpError(404, 'Reminder not found');
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
