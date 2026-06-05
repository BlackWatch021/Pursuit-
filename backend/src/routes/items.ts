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
  reorderItemsSchema,
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

// Bulk reorder / cross-stage move from drag-and-drop. Each update carries the
// item's new stageId + order; a stage change is logged to the activity timeline.
// Declared before '/:id' so the literal path isn't captured as an id.
router.patch(
  '/reorder',
  asyncHandler(async (req, res) => {
    const { updates } = reorderItemsSchema.parse(req.body);
    for (const u of updates) {
      const item = await Item.findOne({ _id: u.id, userId: req.userId });
      if (!item) continue;
      if (item.stageId !== u.stageId) {
        await Activity.create({
          itemId: item._id,
          userId: req.userId,
          type: 'stage_change',
          fromStageId: item.stageId,
          toStageId: u.stageId,
        });
        item.stageId = u.stageId;
      }
      item.order = u.order;
      await item.save();
    }
    res.json({ ok: true });
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

    // Map custom field ids to their human names for the activity log.
    const board = await Board.findOne({ _id: item.boardId, userId: req.userId });
    const fieldName = (id: string) =>
      board?.customFields.find((f) => f.id === id)?.name ?? 'Field';

    const toStr = (v: unknown): string =>
      v == null ? '' : Array.isArray(v) ? v.join(', ') : String(v);
    const dateStr = (d: unknown) => (d ? new Date(d as Date).toISOString().slice(0, 10) : '');

    // Collect human-readable diffs so we can log a field_change per changed field.
    const changes: { label: string; from: string; to: string }[] = [];

    if (data.title !== undefined && data.title !== item.title) {
      changes.push({ label: 'Title', from: item.title, to: data.title });
      item.title = data.title;
    }
    if (data.primaryDate !== undefined && dateStr(data.primaryDate) !== dateStr(item.primaryDate)) {
      changes.push({
        label: 'Applied date',
        from: dateStr(item.primaryDate),
        to: dateStr(data.primaryDate),
      });
      item.primaryDate = data.primaryDate;
    }
    if (data.fields !== undefined) {
      const oldFields = (item.fields as Record<string, unknown>) ?? {};
      for (const [key, val] of Object.entries(data.fields)) {
        if (toStr(oldFields[key]) !== toStr(val)) {
          changes.push({ label: fieldName(key), from: toStr(oldFields[key]), to: toStr(val) });
        }
      }
      item.fields = { ...oldFields, ...data.fields };
      item.markModified('fields');
    }
    if (data.tags !== undefined && toStr(item.tags) !== toStr(data.tags)) {
      changes.push({ label: 'Tags', from: toStr(item.tags), to: toStr(data.tags) });
      item.tags = data.tags;
    }
    if (data.priority !== undefined && data.priority !== item.priority) {
      changes.push({ label: 'Priority', from: item.priority, to: data.priority });
      item.priority = data.priority;
    }
    if (data.archived !== undefined) item.archived = data.archived;

    await item.save();

    if (changes.length > 0) {
      await Activity.insertMany(
        changes.map((c) => ({
          itemId: item._id,
          userId: req.userId,
          type: 'field_change',
          content: `${c.label}: ${c.from || '—'} → ${c.to || '—'}`,
          meta: c,
        })),
      );
    }

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
