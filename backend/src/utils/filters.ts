import { Prisma } from '@prisma/client';

export type QueryFilters = {
  athleteId?: string;
  position?: string;
  group?: string;
  segment?: string;
  startDate?: string;
  endDate?: string;
};

export function buildPerformanceWhere(filters: QueryFilters): Prisma.PerformanceWhereInput {
  const where: Prisma.PerformanceWhereInput = {};
  if (filters.athleteId) where.athleteId = filters.athleteId;
  if (filters.segment) where.segmentName = filters.segment;
  if (filters.position || filters.group) {
    where.athlete = {};
    if (filters.position) where.athlete.position = filters.position;
    if (filters.group) where.athlete.groups = filters.group;
  }
  if (filters.startDate || filters.endDate) {
    where.startDate = {};
    if (filters.startDate) where.startDate.gte = new Date(filters.startDate);
    if (filters.endDate) where.startDate.lte = new Date(filters.endDate);
  }
  return where;
}
