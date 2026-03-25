import { z } from 'zod';

export const WidgetSchema = z.object({
  id: z.string(),
  type: z.enum(['weather', 'clock', 'rss', 'monitor', 'quick-link', 'links', 'calendar', 'memo', 'todo', 'photo-frame', 'date']),
  size: z.object({ w: z.number(), h: z.number() }),
  position: z.object({ x: z.number(), y: z.number() }),
  config: z.record(z.any()).optional().default({}),
});

export const WidgetsArraySchema = z.array(WidgetSchema);
