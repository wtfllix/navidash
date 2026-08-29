import { render, screen } from '@testing-library/react';
import F1Widget from '@/components/widgets/F1Widget';
import type { WidgetOfType } from '@/types';

let mockLocale = 'en';
const originalFetch = global.fetch;

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

  afterEach(() => {
    global.fetch = originalFetch;
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

  it('shows the latest driver standings in standings mode', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        season: 2026,
        round: 12,
        updatedAt: '2026-08-29T00:00:00.000Z',
        stale: false,
        standings: [
          {
            position: 1,
            code: 'ANT',
            givenName: 'Andrea Kimi',
            familyName: 'Antonelli',
            constructor: 'Mercedes',
            points: 242,
            wins: 6,
          },
        ],
      }),
    } as Response);

    render(<F1Widget widget={{ ...widget, config: { view: 'standings' } }} />);

    expect(await screen.findByText('Antonelli')).toBeInTheDocument();
    expect(screen.getByText('ANT · Mercedes')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/f1/standings', expect.any(Object));
  });

  it('shows the full standings in three-column 3x2 mode', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        season: 2026,
        round: 12,
        updatedAt: '2026-08-29T00:00:00.000Z',
        stale: false,
        standings: Array.from({ length: 23 }, (_, index) => {
          const position = index + 1;
          return {
            position,
            code: `D${position}`,
            givenName: `Given ${position}`,
            familyName: `Driver ${position}`,
            constructor: 'Test Team',
            points: 250 - position,
            wins: 0,
          };
        }),
      }),
    } as Response);

    render(
      <F1Widget
        widget={{ ...widget, size: { w: 3, h: 2 }, config: { view: 'standings' } }}
      />
    );

    expect(await screen.findByText('Driver 23')).toBeInTheDocument();
    expect(screen.getByText('Driver 1')).toBeInTheDocument();
  });

  it('orders the compact top three from first to third', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        season: 2026,
        round: 12,
        updatedAt: '2026-08-29T00:00:00.000Z',
        stale: false,
        standings: [
          ['ANT', 'Antonelli', 242],
          ['RUS', 'Russell', 183],
          ['HAM', 'Hamilton', 183],
        ].map(([code, familyName, points], index) => ({
          position: index + 1,
          code,
          givenName: String(familyName),
          familyName,
          constructor: 'Test Team',
          points,
          wins: 0,
        })),
      }),
    } as Response);

    render(
      <F1Widget
        widget={{ ...widget, size: { w: 2, h: 1 }, config: { view: 'standings' } }}
      />
    );

    await screen.findByText('ANT');
    expect(screen.getAllByTitle(/Antonelli|Russell|Hamilton/).map((element) => element.textContent)).toEqual([
      'ANT',
      'RUS',
      'HAM',
    ]);
  });
});
