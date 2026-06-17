import { prisma } from '../utils/prisma.js';

export const AthleteRepository = {
  list() {
    return prisma.athlete.findMany({ orderBy: { id: 'asc' } });
  },
};
