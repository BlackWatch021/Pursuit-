import { Router } from 'express';
import { HttpError } from '../middleware/error';
import { Activity } from '../models/Activity';
import { Board } from '../models/Board';
import { Item } from '../models/Item';
import { Reminder } from '../models/Reminder';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createItemSchema,
  createNoteSchema,
  moveItemSchema,
  updateItemSchema,
} from '../validators/schemas';

const router = Router();

// List items (optionally filtered by board, stage, tag, or title search)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { boardId, stageId, tag, search, archived } = req.query as Record<string, string>;
    const query: Record<string, unknown> = { userId: req.userId, archived: archived === 'true' };
    if (boardId) query.boardId = boardId;
    if (stageId) query.stageId = stageId;
    if (tag) query.tags = tag;
    if (search) query.title = { $regex: search, $options: 'i' };

    const items = await Item.find(query).sort({ stageId: 1, order: 1, createdAt: -1 });
    res.json({ items });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await Item.findOne({ _id: req.params.id, userId: req.userId });
    if (!item) throw new HttpError(404, 'Item not found');
    res.json({ item });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createItemSchema.parse(req.body);
    const board = await Board.findOne({ _id: data.boardId, userId: req.userId });
    if (!board) throw new HttpError(404, 'Board not found');

    const stageId = data.stageId || board.stages[0]?.id;
    if (!stageId) throw new HttpError(400, 'Board has no stages');

    const order = await Item.countDocuments({ boardId: board._id, stageId });
    const item = await Item.create({
      boardId: board._id,
      userId: req.userId,
      title: data.title,
      stageId,
      primaryDate: data.primaryDate ?? new Date(),
      fields: data.fields ?? {},
      tags: data.tags ?? [],
      priority: data.priority ?? 'medium',
      order,
    });
    await Activity.create({ itemId: item._id, userId: req.userId, type: 'created' });

    res.status(201).json({ item });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateItemSchema.parse(req.body);
    const item = await Item.findOne({ _id: req.params.id, userId: req.userId });
    if (!item) throw new HttpError(404, 'Item not found');

    if (data.title !== undefined) item.title = data.title;
    if (data.primaryDate !== undefined) item.primaryDate = data.primaryDate;
    if (data.fields !== undefined) {
      item.fields = { ...(item.fields as Record<string, unknown>), ...data.fields };
      item.markModified('fields');
    }
    if (data.tags !== undefined) item.tags = data.tags;
    if (data.priority !== undefined) item.priority = data.priority;
    if (data.archived !== undefined) item.archived = data.archived;
    await item.save();

    res.json({ item });
  }),
);

// Move item to another stage (and reorder); logs a stage_change activity
router.patch(
  '/:id/stage',
  asyncHandler(async (req, res) => {
    const { stageId, order } = moveItemSchema.parse(req.body);
    const item = await Item.findOne({ _id: req.params.id, userId: req.userId });
    if (!item) throw new HttpError(404, 'Item not found');

    if (item.stageId !== stageId) {
      await Activity.create({
        itemId: item._id,
        userId: req.userId,
        type: 'stage_change',
        fromStageId: item.stageId,
        toStageId: stageId,
      });
      item.stageId = stageId;
    }
    if (typeof order === 'number') item.order = order;
    await item.save();

    res.json({ item });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await Item.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!item) throw new HttpError(404, 'Item not found');
    await Activity.deleteMany({ itemId: item._id });
    await Reminder.deleteMany({ itemId: item._id });
    res.json({ ok: true });
  }),
);

// --- Activity timeline (notes + auto-logged stage changes) ---
router.get(
  '/:id/activities',
  asyncHandler(async (req, res) => {
    const item = await Item.findOne({ _id: req.params.id, userId: req.userId }).select('_id');
    if (!item) throw new HttpError(404, 'Item not found');
    const activities = await Activity.find({ itemId: item._id }).sort({ createdAt: -1 });
    res.json({ activities });
  }),
);

router.post(
  '/:id/activities',
  asyncHandler(async (req, res) => {
    const { content } = createNoteSchema.parse(req.body);
    const item = await Item.findOne({ _id: req.params.id, userId: req.userId }).select('_id');
    if (!item) throw new HttpError(404, 'Item not found');
    const activity = await Activity.create({
      itemId: item._id,
      userId: req.userId,
      type: 'note',
      content,
    });
    res.status(201).json({ activity });
  }),
);

// --- Reminders for a specific item ---
router.get(
  '/:id/reminders',
  asyncHandler(async (req, res) => {
    const item = await Item.findOne({ _id: req.params.id, userId: req.userId }).select('_id');
    if (!item) throw new HttpError(404, 'Item not found');
    const reminders = await Reminder.find({ itemId: item._id }).sort({ dueDate: 1 });
    res.json({ reminders });
  }),
);

export default router;
