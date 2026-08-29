import { act } from '@testing-library/react';
import { DEFAULT_SETTINGS } from '@/types';
import { useSettingsStore } from '@/store/useSettingsStore';

describe('settings store', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({
      ...DEFAULT_SETTINGS,
      language: 'en',
      hasFetchedSettings: true,
      isSavingSettings: false,
      dataVersion: 0,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('立即保存首次引导选择的默认语言', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, version: 12 }),
    } as Response);
    global.fetch = fetchMock;

    act(() => useSettingsStore.getState().setLanguage('zh'));

    let saved = false;
    await act(async () => {
      saved = await useSettingsStore.getState().saveSettings();
    });

    expect(saved).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/settings',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      })
    );

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({ language: 'zh' });
    expect(useSettingsStore.getState()).toMatchObject({
      language: 'zh',
      dataVersion: 12,
      isSavingSettings: false,
    });
  });
});
