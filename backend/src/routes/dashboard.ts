import { Router } from 'express';
import { HttpError } from '../middleware/error';
import { Activity } from '../models/Activity';
import { Board, BoardDoc } from '../models/Board';
import { Item } from '../models/Item';
import { Reminder } from '../models/Reminder';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

async function resolveBoard(userId: string, boardId?: string): Promise<BoardDoc> {
  const board = boardId
    ? await Board.findOne({ _id: boardId, userId })
    : await Board.findOne({ userId }).sort({ isDefault: -1, createdAt: 1 });
  if (!board) throw new HttpError(404, 'Board not found');
  return board;
}

const dayKey = (d: Date) => new Date(d).toISOString().slice(0, 10);

function weekStartKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0 Sun .. 6 Sat
  date.setUTCDate(date.getUTCDate() + ((day === 0 ? -6 : 1) - day)); // back to Monday
  return date.toISOString().slice(0, 10);
}

// GET /api/dashboard — pipeline stats, funnel, weekly trend, reminders, recent activity
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const board = await resolveBoard(userId, req.query.boardId as string | undefined);
    const items = await Item.find({ boardId: board._id, userId, archived: false });

    const stagesByOrder = [...board.stages].sort((a, b) => a.order - b.order);

    const perStage: Record<string, number> = {};
    for (const s of board.stages) perStage[s.id] = 0;
    for (const it of items) if (perStage[it.stageId] !== undefined) perStage[it.stageId]++;

    // "reached" = items that ever entered a stage (activity history ∪ current stage)
    const reached: Record<string, number> = {};
    for (const s of stagesByOrder) {
      const movedIds = (
        await Activity.distinct('itemId', { userId, type: 'stage_change', toStageId: s.id })
      ).map(String);
      const ids = new Set(movedIds);
      for (const it of items) if (it.stageId === s.id) ids.add(String(it._id));
      reached[s.id] = ids.size;
    }

    const funnel = stagesByOrder.map((s) => ({
      stageId: s.id,
      name: s.name,
      color: s.color,
      current: perStage[s.id] ?? 0,
      reached: reached[s.id] ?? 0,
    }));

    const reachedByName = (name: string) => {
      const s = stagesByOrder.find((x) => x.name.toLowerCase() === name);
      return s ? reached[s.id] ?? 0 : 0;
    };
    const applied = reachedByName('applied');
    const rate = (n: number) => (applied > 0 ? Math.round((n / applied) * 100) : 0);

    // applications per week (last 12 weeks)
    const weeks: { week: string; count: number }[] = [];
    const weekIndex = new Map<string, number>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i * 7);
      const key = weekStartKey(d);
      weekIndex.set(key, weeks.length);
      weeks.push({ week: key, count: 0 });
    }
    for (const it of items) {
      const idx = weekIndex.get(weekStartKey(new Date(it.primaryDate)));
      if (idx !== undefined) weeks[idx].count++;
    }

    const terminal = new Set(['accepted', 'rejected']);
    const terminalCount = stagesByOrder
      .filter((s) => terminal.has(s.name.toLowerCase()))
      .reduce((sum, s) => sum + (perStage[s.id] ?? 0), 0);

    const total = items.length;
    const stats = {
      total,
      active: total - terminalCount,
      responseRate: rate(reachedByName('screening')),
      interviewRate: rate(reachedByName('interview')),
      offerRate: rate(reachedByName('offer')),
    };

    const reminders = await Reminder.find({ userId, done: false })
      .sort({ dueDate: 1 })
      .limit(6)
      .populate('itemId', 'title');

    const recent = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('itemId', 'title');

    res.json({
      board: { id: String(board._id), name: board.name, stages: board.stages },
      stats,
      perStage,
      funnel,
      weeks,
      reminders,
      recent,
    });
  }),
);

// GET /api/dashboard/calendar — per-day heatmap + reminder events
router.get(
  '/calendar',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const board = await resolveBoard(userId, req.query.boardId as string | undefined);
    const year = req.query.year ? Number(req.query.year) : new Date().getUTCFullYear();

    const items = await Item.find({ boardId: board._id, userId, archived: false }).select(
      'title stageId primaryDate',
    );
    const counts: Record<string, number> = {};
    const itemsInYear: { id: string; title: string; stageId: string; primaryDate: Date }[] = [];
    for (const it of items) {
      const d = new Date(it.primaryDate);
      if (d.getUTCFullYear() !== year) continue;
      const key = dayKey(d);
      counts[key] = (counts[key] || 0) + 1;
      itemsInYear.push({
        id: String(it._id),
        title: it.title,
        stageId: it.stageId,
        primaryDate: it.primaryDate,
      });
    }
    const heatmap = Object.entries(counts).map(([date, count]) => ({ date, count }));

    const reminders = await Reminder.find({ userId }).populate('itemId', 'title');
    const events = reminders.map((r) => ({
      id: String(r._id),
      type: 'reminder' as const,
      date: r.dueDate,
      title: (r.itemId as unknown as { title?: string })?.title || 'Reminder',
      note: r.note,
      done: r.done,
    }));

    // Recent activity for this board within the selected year (GitHub-style feed).
    const boardItemIds = await Item.find({ boardId: board._id, userId }).distinct('_id');
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year + 1, 0, 1));
    const recentDocs = await Activity.find({
      userId,
      itemId: { $in: boardItemIds },
      createdAt: { $gte: yearStart, $lt: yearEnd },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('itemId', 'title');
    const recent = recentDocs.map((a) => {
      const item = a.itemId as unknown as { _id?: unknown; title?: string } | null;
      return {
        id: String(a._id),
        type: a.type,
        content: a.content,
        fromStageId: a.fromStageId,
        toStageId: a.toStageId,
        meta: a.meta,
        itemTitle: item?.title || 'Untitled',
        itemId: item?._id ? String(item._id) : null,
        createdAt: a.createdAt,
      };
    });

    res.json({ year, stages: board.stages, heatmap, items: itemsInYear, events, recent });
  }),
);

export default router;
