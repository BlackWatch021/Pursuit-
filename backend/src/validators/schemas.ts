import { z } from 'zod';
import { FIELD_TYPES } from '../models/Board';
import { PRIORITIES } from '../models/Item';

export const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  image: z.string().max(1000).optional(),
});

export const updateEmailSchema = z.object({
  email: z.string().email(),
  currentPassword: z.string().min(1),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(200),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
  newPassword: z.string().min(6).max(200),
});

const stageInput = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  order: z.number(),
  color: z.string(),
});

const fieldInput = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  type: z.enum(FIELD_TYPES),
  options: z.array(z.string()).optional(),
});

const boardLabelFields = {
  titleLabel: z.string().min(1).max(40).optional(),
  dateLabel: z.string().min(1).max(40).optional(),
  showTags: z.boolean().optional(),
  showPriority: z.boolean().optional(),
};

export const createBoardSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  stages: z.array(stageInput).optional(),
  customFields: z.array(fieldInput).optional(),
  ...boardLabelFields,
});

export const updateBoardSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  stages: z.array(stageInput).optional(),
  customFields: z.array(fieldInput).optional(),
  ...boardLabelFields,
});

export const deleteStageSchema = z.object({
  // 'move' reassigns the stage's items to targetStageId; 'delete' removes them.
  strategy: z.enum(['move', 'delete']),
  targetStageId: z.string().optional(),
});

export const createItemSchema = z.object({
  boardId: z.string(),
  title: z.string().min(1),
  stageId: z.string().optional(),
  primaryDate: z.coerce.date().optional(),
  fields: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(PRIORITIES).optional(),
});

export const updateItemSchema = z.object({
  title: z.string().min(1).optional(),
  primaryDate: z.coerce.date().optional(),
  fields: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(PRIORITIES).optional(),
  archived: z.boolean().optional(),
});

export const moveItemSchema = z.object({
  stageId: z.string(),
  order: z.number().optional(),
});

export const reorderItemsSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string(),
      stageId: z.string(),
      order: z.number(),
    }),
  ),
});

export const createNoteSchema = z.object({
  content: z.string().min(1),
});

export const createReminderSchema = z.object({
  itemId: z.string(),
  dueDate: z.coerce.date(),
  note: z.string().optional(),
});

export const updateReminderSchema = z.object({
  dueDate: z.coerce.date().optional(),
  note: z.string().optional(),
  done: z.boolean().optional(),
});
