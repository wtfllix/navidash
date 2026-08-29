import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FirstRunGuide from '@/components/onboarding/FirstRunGuide';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useToastStore } from '@/store/useToastStore';
import { useUIStore } from '@/store/useUIStore';
import { useWidgetStore } from '@/store/useWidgetStore';

let mockLocale = 'zh';
const mockReplace = jest.fn();

jest.mock('next-intl', () => ({
  useLocale: () => mockLocale,
  useTranslations: () => (key: string, values?: Record<string, number | string>) =>
    values?.count === undefined ? key : `${key}:${values.count}`,
}));

jest.mock('../navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../components/bookmarks/BookmarkTextImporter', () => ({
  __esModule: true,
  default: function MockBookmarkTextImporter({
    onImport,
  }: {
    onImport: (items: Array<{ id: string; title: string; url: string }>) => boolean;
  }) {
    return (
      <button
        type="button"
        onClick={() =>
          onImport([{ id: 'guide-link', title: 'GitHub', url: 'https://github.com/' }])
        }
      >
        mock_import
      </button>
    );
  },
}));

describe('FirstRunGuide', () => {
  const mockImportBookmarks = jest.fn();
  const mockSaveWidgetConfigs = jest.fn();
  const mockOpenWidgetStore = jest.fn();
  const mockSetEditing = jest.fn();
  const mockSetOnboardingOpen = jest.fn();
  const mockAddToast = jest.fn();
  const mockFetchSettings = jest.fn();
  const mockSetLanguage = jest.fn();
  const mockSaveSettings = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockLocale = 'zh';
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn().mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }),
    });

    mockSaveWidgetConfigs.mockResolvedValue(true);
    mockFetchSettings.mockResolvedValue(undefined);
    mockSaveSettings.mockResolvedValue(true);

    useWidgetStore.setState({
      isSnapshotLoaded: true,
      revision: 0,
      layoutsByMode: { desktop: [], mobile: [] },
      widgetConfigs: [],
      bookmarks: [],
      importBookmarks: mockImportBookmarks,
      saveWidgetConfigs: mockSaveWidgetConfigs,
    });
    useSidebarStore.setState({ open: mockOpenWidgetStore });
    useUIStore.setState({
      setEditing: mockSetEditing,
      setOnboardingOpen: mockSetOnboardingOpen,
    });
    useToastStore.setState({ addToast: mockAddToast });
    useSettingsStore.setState({
      hasFetchedSettings: true,
      fetchSettings: mockFetchSettings,
      setLanguage: mockSetLanguage,
      saveSettings: mockSaveSettings,
    });
  });

  it('完成三步后保存书签并进入真实组件库', async () => {
    render(<FirstRunGuide />);

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: 'step_one' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'mock_import' }));
    fireEvent.click(screen.getByRole('button', { name: 'continue_action' }));
    expect(screen.getByRole('heading', { name: 'step_two' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'continue_action' }));
    expect(screen.getByRole('heading', { name: 'step_three' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'start_action' }));

    await waitFor(() => expect(mockSaveWidgetConfigs).toHaveBeenCalledTimes(1));
    expect(mockImportBookmarks).toHaveBeenCalledWith([
      { id: 'guide-link', title: 'GitHub', url: 'https://github.com/' },
    ]);
    expect(mockSetLanguage).toHaveBeenCalledWith('zh');
    expect(mockSetEditing).toHaveBeenCalledWith(true);
    expect(mockOpenWidgetStore).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('navidash-onboarding-bookmarks')).toBeNull();
    expect(sessionStorage.getItem('navidash-onboarding-step')).toBeNull();
  });

  it('语言切换完成后恢复按钮，并保留当前步骤和待导入书签', async () => {
    sessionStorage.setItem('navidash-onboarding-step', 'keyboard');
    sessionStorage.setItem(
      'navidash-onboarding-bookmarks',
      JSON.stringify([{ id: 'saved-link', title: 'Saved', url: 'https://example.com/' }])
    );
    const view = render(<FirstRunGuide />);

    expect(screen.getByRole('heading', { name: 'step_two' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/', { locale: 'en' }));
    expect(screen.getByRole('button', { name: '…' })).toBeDisabled();

    mockLocale = 'en';
    view.rerender(<FirstRunGuide />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'English' })).toBeEnabled());
    expect(screen.getByRole('heading', { name: 'step_two' })).toBeInTheDocument();
    expect(sessionStorage.getItem('navidash-onboarding-bookmarks')).toContain('saved-link');
  });

  it('快照保存失败时保留步骤与待导入内容', async () => {
    sessionStorage.setItem('navidash-onboarding-step', 'canvas');
    sessionStorage.setItem(
      'navidash-onboarding-bookmarks',
      JSON.stringify([{ id: 'pending-link', title: 'Pending', url: 'https://example.com/' }])
    );
    mockSaveWidgetConfigs.mockResolvedValue(false);

    render(<FirstRunGuide />);
    fireEvent.click(screen.getByRole('button', { name: 'start_action' }));

    await waitFor(() => expect(mockAddToast).toHaveBeenCalledWith('save_failed', 'error'));
    expect(screen.getByRole('heading', { name: 'step_three' })).toBeInTheDocument();
    expect(sessionStorage.getItem('navidash-onboarding-step')).toBe('canvas');
    expect(sessionStorage.getItem('navidash-onboarding-bookmarks')).toContain('pending-link');
    expect(mockOpenWidgetStore).not.toHaveBeenCalled();
  });
});
