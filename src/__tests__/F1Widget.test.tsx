import { render, screen } from '@testing-library/react';
import F1Widget from '@/components/widgets/F1Widget';
import type { WidgetOfType } from '@/types';

let mockLocale = 'en';

jest.mock('next-intl', () => ({
  useLocale: () => mockLocale,
  useTranslations: () => (key: string) => key,
}));

const widget: WidgetOfType<'f1'> = {
  id: 'f1-schedule',
  type: 'f1',
  size: { w: 2, h: 2 },
  position: { x: 0, y: 0 },
  config: {},
};

describe('F1Widget', () => {
  beforeEach(() => {
    mockLocale = 'en';
  });

  it('shows the next race weekend in English', () => {
    render(<F1Widget widget={widget} previewDate={new Date('2026-08-15T00:00:00Z')} />);

    expect(screen.getByTestId('f1-widget')).toBeInTheDocument();
    expect(screen.getByText('Dutch Grand Prix')).toBeInTheDocument();
    expect(screen.getAllByText('f1_sprint_qualifying').length).toBeGreaterThan(0);
  });

  it('uses Chinese event names and can include practice sessions', () => {
    mockLocale = 'zh-CN';
    render(
      <F1Widget
        widget={{ ...widget, config: { showPractice: true, showCountdown: false } }}
        previewDate={new Date('2026-08-15T00:00:00Z')}
      />
    );

    expect(screen.getByText('荷兰大奖赛')).toBeInTheDocument();
    expect(screen.getAllByText('f1_practice_1').length).toBeGreaterThan(0);
  });

  it('shows a clear completed-season state', () => {
    render(<F1Widget widget={widget} previewDate={new Date('2026-12-07T00:00:00Z')} />);

    expect(screen.getByText('f1_season_complete')).toBeInTheDocument();
  });
});
