import { config } from '../config';
import { Reminder } from '../models/Reminder';
import { User } from '../models/User';
import { reminderEmail, sendMail } from './mailer';

const CHECK_MS = config.reminderCheckMinutes * 60 * 1000;
const LOOKBACK_MS = config.reminderLookbackDays * 24 * 60 * 60 * 1000;

// Guard against overlapping runs (a slow SMTP send shouldn't let the next tick
// start a second pass over the same reminders).
let running = false;

type PopulatedItem = { title?: string; boardId?: { name?: string } | null } | null;

/**
 * Email every reminder that is due, not done, and not yet notified. Returns the
 * number of emails actually sent. Safe to call repeatedly — each reminder is
 * claimed atomically (`notifiedAt`) so it can only ever be emailed once.
 */
export async function runReminderCheck(): Promise<number> {
  if (running) return 0;
  running = true;
  let sent = 0;
  try {
    const now = new Date();
    const since = new Date(now.getTime() - LOOKBACK_MS);

    // notifyAt = dueDate - leadMinutes, so "send before due" is handled here.
    const due = await Reminder.find({
      done: false,
      notifiedAt: null,
      notifyAt: { $lte: now, $gte: since },
    })
      .populate({
        path: 'itemId',
        select: 'title boardId',
        populate: { path: 'boardId', select: 'name' },
      })
      .limit(100);

    if (due.length === 0) return 0;

    // Fetch the relevant users once and respect their opt-out preference.
    const userIds = [...new Set(due.map((r) => String(r.userId)))];
    const users = await User.find({ _id: { $in: userIds } }).select('email emailReminders');
    const userById = new Map(users.map((u) => [String(u._id), u]));

    for (const r of due) {
      const user = userById.get(String(r.userId));
      if (!user || user.emailReminders === false) continue;

      // Atomically claim this reminder so concurrent runs can't double-send.
      const claimed = await Reminder.findOneAndUpdate(
        { _id: r._id, notifiedAt: null },
        { notifiedAt: now },
      );
      if (!claimed) continue;

      const item = r.itemId as unknown as PopulatedItem;
      const mail = reminderEmail({
        itemTitle: item?.title || 'an item',
        boardName: item?.boardId?.name || 'your board',
        note: r.note,
        dueDate: r.dueDate,
        url: `${config.clientOrigin}/reminders`,
      });

      try {
        await sendMail({ to: user.email, ...mail });
        sent++;
      } catch (err) {
        // Sending failed — release the claim so the next run retries it.
        await Reminder.updateOne({ _id: r._id }, { notifiedAt: null });
        console.error('[reminders] send failed, will retry next run:', err);
      }
    }

    if (sent > 0) console.log(`[reminders] sent ${sent} reminder email(s)`);
  } catch (err) {
    console.error('[reminders] check failed:', err);
  } finally {
    running = false;
  }
  return sent;
}

/** Start the recurring due-reminder email check (initial pass shortly after boot). */
export function startReminderNotifier() {
  setTimeout(() => void runReminderCheck(), 20_000);
  setInterval(() => void runReminderCheck(), CHECK_MS);
  console.log(`[reminders] email notifier active (every ${config.reminderCheckMinutes}m)`);
}
