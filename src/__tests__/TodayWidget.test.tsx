import { render, screen } from '@testing-library/react';
import TodayWidget, { getTodayAccent } from '@/components/widgets/TodayWidget';
import type { WidgetOfType } from '@/types';

let mockLocale = 'en';

jest.mock('next-intl', () => ({
  useLocale: () => mockLocale,
  useTranslations: () => (key: string) => key,
}));

const widget: WidgetOfType<'today'> = {
  id: 'today-panel',
  type: 'today',
  size: { w: 2, h: 2 },
  position: { x: 0, y: 0 },
  config: {},
};

describe('TodayWidget', () => {
  beforeEach(() => {
    mockLocale = 'en';
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-25T09:42:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('在未配置天气时仍显示本地时间与日期', () => {
    render(<TodayWidget widget={widget} />);

    expect(screen.getByLabelText('09:42')).toBeInTheDocument();
    expect(screen.getByText('Jul 25')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.getByText('weather_setup_title')).toBeInTheDocument();
    expect(screen.getByTestId('today-clock-minute')).toHaveTextContent('42');
  });

  it('在中文界面中仍使用英文日期与星期', () => {
    mockLocale = 'zh-CN';

    render(<TodayWidget widget={widget} />);

    expect(screen.getByText('Jul 25')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.queryByText('7月 25')).not.toBeInTheDocument();
    expect(screen.getByLabelText('09:42')).toHaveClass('font-outfit');
  });

  it('同一天保持固定强调色，并在次日切换', () => {
    const morning = getTodayAccent(new Date('2026-07-25T08:00:00'));
    const evening = getTodayAccent(new Date('2026-07-25T22:00:00'));
    const nextDay = getTodayAccent(new Date('2026-07-26T08:00:00'));

    expect(morning).toEqual(evening);
    expect(nextDay).not.toEqual(morning);

    render(<TodayWidget widget={widget} />);
    expect(screen.getByTestId('today-panel')).toHaveStyle({
      '--today-accent': morning.color,
    });
  });
});
