import { prisma } from '../utils/prisma.js';
import { buildPerformanceWhere, QueryFilters } from '../utils/filters.js';

export const PerformanceRepository = {
  list(filters: QueryFilters) {
    return prisma.performance.findMany({
      where: buildPerformanceWhere(filters),
      include: { athlete: true },
      orderBy: { startDate: 'desc' },
      take: 500,
    });
  },
};
