import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StatsState {
  visitCounts: Record<string, number>;
  incrementVisit: (id: string) => void;
  getTopVisited: (limit?: number) => string[];
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      visitCounts: {},
      incrementVisit: (id) => {
        // Demo Mode Protection: Do not track visits
        if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return;

        set((state) => ({
          visitCounts: {
            ...state.visitCounts,
            [id]: (state.visitCounts[id] || 0) + 1,
          },
        }));
      },
      getTopVisited: (limit = 5) => {
        const { visitCounts } = get();
        return Object.entries(visitCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([id]) => id);
      },
    }),
    {
      name: 'stats-storage',
    }
  )
);
