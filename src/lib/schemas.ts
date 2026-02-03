import { z } from 'zod';

export const WidgetSchema = z.object({
  id: z.string(),
  type: z.enum(['weather', 'clock', 'rss', 'monitor', 'quick-link', 'calendar', 'memo', 'todo', 'photo-frame', 'date', 'most-visited']),
  size: z.object({ w: z.number(), h: z.number() }),
  position: z.object({ x: z.number(), y: z.number() }),
  config: z.record(z.any()).optional().default({}),
});

export const BookmarkSchema: z.ZodSchema<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
    children: z.array(BookmarkSchema).optional(),
  })
);

export const BookmarksArraySchema = z.array(BookmarkSchema);
export const WidgetsArraySchema = z.array(WidgetSchema);
