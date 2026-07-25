import { useUIStore } from '@/store/useUIStore';

describe('useUIStore launcher state', () => {
  beforeEach(() => {
    useUIStore.setState({
      isLauncherOpen: false,
      isSettingsOpen: false,
      isEditing: false,
    });
  });

  it('opens and closes the shared launcher', () => {
    useUIStore.getState().openLauncher();
    expect(useUIStore.getState().isLauncherOpen).toBe(true);

    useUIStore.getState().closeLauncher();
    expect(useUIStore.getState().isLauncherOpen).toBe(false);
  });
});
