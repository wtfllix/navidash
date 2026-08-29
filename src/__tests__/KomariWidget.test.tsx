import { render, screen } from '@testing-library/react';
import KomariWidget from '@/components/widgets/KomariWidget';
import { getAllowedSizePresets, getDefaultAllowedSize } from '@/components/widgets/editors/shared';
import type { KomariStatusResponse } from '@/lib/server/komari';
import type { WidgetOfType } from '@/types';

let mockStatus: KomariStatusResponse | null;

jest.mock('../lib/komariStatus', () => ({
  useKomariStatus: () => mockStatus,
}));

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    if (key === 'komari_uptime_days') return `up ${values?.count} days`;
    if (key === 'komari_uptime_hours') return `up ${values?.count} hours`;
    if (key === 'komari_online_uptime') return `Online · ${values?.uptime}`;
    if (key === 'komari_updated') return `Updated ${values?.time}`;
    return key;
  },
}));

const baseWidget: WidgetOfType<'komari'> = {
  id: 'komari-node',
  type: 'komari',
  size: { w: 2, h: 2 },
  position: { x: 0, y: 0 },
  config: {
    nodeId: '30529324-e285-4cbd-ae6a-7011f7bdcfa6',
    showNetwork: true,
    refreshInterval: 5,
  },
};

describe('KomariWidget size variants', () => {
  beforeEach(() => {
    mockStatus = {
      state: 'ok',
      sampledAt: '2026-08-27T02:09:00.000Z',
      node: {
        id: '30529324-e285-4cbd-ae6a-7011f7bdcfa6',
        name: 'Lightlayer.SJC/33 ¥',
        regionFlag: '🇺🇸',
        online: true,
        updatedAt: '2026-08-27T02:09:00.000Z',
        uptimeSeconds: 604_800,
        cpuPercent: 1,
        memory: { usedBytes: 270 * 1024 * 1024, totalBytes: 962 * 1024 * 1024, percent: 28.1 },
        disk: { usedBytes: 8.8 * 1024 ** 3, totalBytes: 49.8 * 1024 ** 3, percent: 17.7 },
        network: {
          rxBytesPerSecond: 4.3 * 1024,
          txBytesPerSecond: 6.3 * 1024,
          totalDownBytes: 70.4 * 1024 ** 3,
          trafficLimitBytes: 0,
        },
      },
    };
  });

  it('keeps 2 × 2 as the default and exposes the two compact presets', () => {
    expect(getDefaultAllowedSize('komari')).toEqual({ w: 2, h: 2 });
    expect(getAllowedSizePresets('komari').map(({ w, h }) => `${w}x${h}`)).toEqual([
      '2x2',
      '2x1',
      '1x1',
    ]);
  });

  it('renders the complete resource and traffic summary at 2 × 2', () => {
    render(<KomariWidget widget={baseWidget} />);

    expect(screen.getByTestId('komari-layout-full')).toBeInTheDocument();
    expect(screen.getByText('komari_traffic')).toBeInTheDocument();
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it('keeps percentages and live rates but removes traffic details at 2 × 1', () => {
    render(<KomariWidget widget={{ ...baseWidget, size: { w: 2, h: 1 } }} />);

    expect(screen.getByTestId('komari-layout-compact')).toBeInTheDocument();
    expect(screen.getByTestId('komari-resource-strip')).toBeInTheDocument();
    expect(screen.getByTestId('komari-compact-network')).toBeInTheDocument();
    expect(screen.queryByText('komari_traffic')).not.toBeInTheDocument();
    expect(screen.queryByText(/Updated/)).not.toBeInTheDocument();
  });

  it('keeps identity, uptime, and resource percentages only at 1 × 1', () => {
    render(<KomariWidget widget={{ ...baseWidget, size: { w: 1, h: 1 } }} />);

    expect(screen.getByTestId('komari-layout-mini')).toBeInTheDocument();
    expect(screen.getByTestId('komari-resource-strip')).toBeInTheDocument();
    expect(screen.queryByTestId('komari-compact-network')).not.toBeInTheDocument();
    expect(screen.queryByText('komari_traffic')).not.toBeInTheDocument();
  });
});
