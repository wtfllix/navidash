import { WidgetSchema } from '@/lib/schemas';

describe('Zod Schemas', () => {

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

  it('should validate a date widget', () => {
    const widget = {
      id: 'w2',
      type: 'date',
      size: { w: 1, h: 1 },
      position: { x: 0, y: 0 },
      config: {}
    };
    const result = WidgetSchema.safeParse(widget);
    expect(result.success).toBe(true);
  });

  it('should validate a links widget', () => {
    const widget = {
      id: 'w3',
      type: 'links',
      size: { w: 2, h: 1 },
      position: { x: 0, y: 0 },
      config: {
        title: 'Work Links',
        links: [
          { id: 'l1', title: 'GitHub', url: 'https://github.com' },
          { id: 'l2', title: 'Notion', url: 'https://notion.so' }
        ],
        showLabels: true,
        iconSize: 'md'
      }
    };
    const result = WidgetSchema.safeParse(widget);
    expect(result.success).toBe(true);
  });
});
