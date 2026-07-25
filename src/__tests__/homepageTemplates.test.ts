import { HOMEPAGE_TEMPLATES } from '@/lib/homepageTemplates';
import { WidgetConfigsArraySchema, WidgetLayoutsByModeSchema } from '@/lib/schemas';

describe('homepage templates', () => {
  it.each(HOMEPAGE_TEMPLATES)('$id uses the normal widget data contract', (template) => {
    expect(WidgetLayoutsByModeSchema.safeParse(template.layoutsByMode).success).toBe(true);
    expect(WidgetConfigsArraySchema.safeParse(template.configs).success).toBe(true);

    const configIds = new Set(template.configs.map((config) => config.id));
    for (const layout of [
      ...template.layoutsByMode.desktop,
      ...template.layoutsByMode.mobile,
    ]) {
      expect(configIds.has(layout.id)).toBe(true);
    }
  });
});
