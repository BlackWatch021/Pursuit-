import { randomUUID } from 'crypto';
import { Board, BoardDoc } from '../models/Board';

/**
 * Creates the default "Job Applications" board for a new user — the flagship
 * tracker. The generic Board/stage/field model means other trackers (Courses,
 * Projects, ...) can be added later as additional boards with no code changes.
 */
export async function createDefaultBoard(userId: string): Promise<BoardDoc> {
  const stage = (name: string, order: number, color: string) => ({
    id: randomUUID(),
    name,
    order,
    color,
  });

  const stages = [
    stage('Wishlist', 0, '#64748B'),
    stage('Applied', 1, '#3B82F6'),
    stage('Screening', 2, '#8B5CF6'),
    stage('Interview', 3, '#F59E0B'),
    stage('Offer', 4, '#10B981'),
    stage('Accepted', 5, '#22C55E'),
    stage('Rejected', 6, '#F43F5E'),
  ];

  const field = (name: string, type: string, options?: string[]) => ({
    id: randomUUID(),
    name,
    type,
    options,
  });

  const customFields = [
    field('Role', 'text'),
    field('Location', 'text'),
    field('Salary', 'text'),
    field('Job URL', 'url'),
    field('Source', 'select', ['LinkedIn', 'Company Site', 'Referral', 'Indeed', 'Glassdoor', 'Other']),
    field('Resume Version', 'text'),
    field('Contact', 'text'),
  ];

  return Board.create({
    userId,
    name: 'Job Applications',
    slug: 'job-applications',
    color: '#6366F1',
    stages,
    customFields,
    titleLabel: 'Company',
    dateLabel: 'Applied date',
    itemLabel: 'Application',
    finalStageId: stages.find((s) => s.name === 'Accepted')?.id,
    isDefault: true,
  });
}
