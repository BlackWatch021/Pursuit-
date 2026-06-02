import { randomUUID } from 'crypto';
import { Router } from 'express';
import { HttpError } from '../middleware/error';
import { Activity } from '../models/Activity';
import { Board } from '../models/Board';
import { Item } from '../models/Item';
import { Reminder } from '../models/Reminder';
import { asyncHandler } from '../utils/asyncHandler';
import { createBoardSchema, deleteStageSchema, updateBoardSchema } from '../validators/schemas';

const router = Router();

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const boards = await Board.find({ userId: req.userId }).sort({ isDefault: -1, createdAt: 1 });
    res.json({ boards });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const board = await Board.findOne({ _id: req.params.id, userId: req.userId });
    if (!board) throw new HttpError(404, 'Board not found');
    res.json({ board });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createBoardSchema.parse(req.body);
    const stages = (data.stages ?? []).map((s) => ({ ...s, id: s.id || randomUUID() }));
    const customFields = (data.customFields ?? []).map((f) => ({ ...f, id: f.id || randomUUID() }));
    const board = await Board.create({
      userId: req.userId,
      name: data.name,
      slug: slugify(data.name),
      color: data.color,
      stages,
      customFields,
    });
    res.status(201).json({ board });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateBoardSchema.parse(req.body);
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) {
      update.name = data.name;
      update.slug = slugify(data.name);
    }
    if (data.color !== undefined) update.color = data.color;
    if (data.stages !== undefined)
      update.stages = data.stages.map((s) => ({ ...s, id: s.id || randomUUID() }));
    if (data.customFields !== undefined)
      update.customFields = data.customFields.map((f) => ({ ...f, id: f.id || randomUUID() }));

    const board = await Board.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, update, {
      new: true,
    });
    if (!board) throw new HttpError(404, 'Board not found');
    res.json({ board });
  }),
);

// Delete a single stage, handling the items that live in it atomically:
// either move them to another stage, or delete them (with notes + reminders).
router.delete(
  '/:id/stages/:stageId',
  asyncHandler(async (req, res) => {
    const { strategy, targetStageId } = deleteStageSchema.parse(req.body);
    const board = await Board.findOne({ _id: req.params.id, userId: req.userId });
    if (!board) throw new HttpError(404, 'Board not found');

    const { stageId } = req.params;
    const stage = board.stages.find((s) => s.id === stageId);
    if (!stage) throw new HttpError(404, 'Stage not found');
    if (board.stages.length <= 1) throw new HttpError(400, 'A board must have at least one stage');

    if (strategy === 'move') {
      if (!targetStageId) throw new HttpError(400, 'A target stage is required to move applications');
      if (targetStageId === stageId) throw new HttpError(400, 'Cannot move applications to the same stage');
      if (!board.stages.some((s) => s.id === targetStageId)) {
        throw new HttpError(404, 'Target stage not found');
      }
      await Item.updateMany(
        { boardId: board._id, userId: req.userId, stageId },
        { $set: { stageId: targetStageId } },
      );
    } else {
      const items = await Item.find({ boardId: board._id, stageId }).select('_id');
      const itemIds = items.map((i) => i._id);
      await Activity.deleteMany({ itemId: { $in: itemIds } });
      await Reminder.deleteMany({ itemId: { $in: itemIds } });
      await Item.deleteMany({ boardId: board._id, stageId });
    }

    board.set(
      'stages',
      board.stages
        .filter((s) => s.id !== stageId)
        .map((s) => ({ id: s.id, name: s.name, order: s.order, color: s.color })),
    );
    await board.save();

    res.json({ board });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const board = await Board.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!board) throw new HttpError(404, 'Board not found');

    const items = await Item.find({ boardId: board._id }).select('_id');
    const itemIds = items.map((i) => i._id);
    await Activity.deleteMany({ itemId: { $in: itemIds } });
    await Reminder.deleteMany({ itemId: { $in: itemIds } });
    await Item.deleteMany({ boardId: board._id });

    res.json({ ok: true });
  }),
);

export default router;
