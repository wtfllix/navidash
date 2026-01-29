import { BookmarkSchema, WidgetSchema } from '@/lib/schemas';

describe('Zod Schemas', () => {
  it('should validate a correct bookmark', () => {
    const bookmark = {
      id: '1',
      title: 'Google',
      url: 'https://google.com',
      icon: 'search'
    };
    const result = BookmarkSchema.safeParse(bookmark);
    expect(result.success).toBe(true);
  });

  it('should validate a bookmark with children', () => {
    const bookmark = {
      id: '1',
      title: 'Folder',
      children: [
        {
          id: '2',
          title: 'Child',
          url: 'https://example.com'
        }
      ]
    };
    const result = BookmarkSchema.safeParse(bookmark);
    expect(result.success).toBe(true);
  });

  it('should fail on invalid bookmark', () => {
    const bookmark = {
      id: 123, // should be string
      title: 'Invalid'
    };
    const result = BookmarkSchema.safeParse(bookmark);
    expect(result.success).toBe(false);
  });

  it('should validate a correct widget', () => {
    const widget = {
      id: 'w1',
      type: 'clock',
      size: { w: 1, h: 1 },
      position: { x: 0, y: 0 },
      config: {}
    };
    const result = WidgetSchema.safeParse(widget);
    expect(result.success).toBe(true);
  });
});
