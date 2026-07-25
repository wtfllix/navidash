import { act, render } from '@testing-library/react';
import DataSyncer from '@/components/layout/DataSyncer';

const mockFetchWidgets = jest.fn<Promise<void>, []>();
const mockFetchSettings = jest.fn<Promise<void>, [boolean?]>();

jest.mock('../store/useWidgetStore', () => ({
  useWidgetStore: () => ({ fetchWidgets: mockFetchWidgets }),
}));

jest.mock('../store/useSettingsStore', () => ({
  useSettingsStore: () => ({ fetchSettings: mockFetchSettings }),
}));

jest.mock('../lib/demo', () => ({
  isClientDemoMode: false,
}));

describe('DataSyncer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-25T09:00:00'));
    mockFetchWidgets.mockReset().mockResolvedValue(undefined);
    mockFetchSettings.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('首次加载同步一次且不再持续轮询', async () => {
    render(<DataSyncer />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetchWidgets).toHaveBeenCalledTimes(1);
    expect(mockFetchSettings).toHaveBeenCalledTimes(1);
    expect(mockFetchSettings).toHaveBeenLastCalledWith(true);

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(mockFetchWidgets).toHaveBeenCalledTimes(1);
    expect(mockFetchSettings).toHaveBeenCalledTimes(1);
  });

  it('合并短时间内重复的页面恢复事件', async () => {
    render(<DataSyncer />);

    await act(async () => {
      await Promise.resolve();
    });

    jest.setSystemTime(new Date('2026-07-25T09:00:02'));
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('pageshow'));
      await Promise.resolve();
    });

    expect(mockFetchWidgets).toHaveBeenCalledTimes(2);
    expect(mockFetchSettings).toHaveBeenCalledTimes(2);

    jest.setSystemTime(new Date('2026-07-25T09:00:04'));
    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await Promise.resolve();
    });

    expect(mockFetchWidgets).toHaveBeenCalledTimes(3);
    expect(mockFetchSettings).toHaveBeenCalledTimes(3);
  });
});
