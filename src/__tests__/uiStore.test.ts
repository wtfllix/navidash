import { useUIStore } from '@/store/useUIStore';

describe('useUIStore launcher state', () => {
  beforeEach(() => {
    useUIStore.setState({
      isLauncherOpen: false,
      isSettingsOpen: false,
      isEditing: false,
      isOnboardingOpen: false,
    });
  });

  it('opens and closes the shared launcher', () => {
    useUIStore.getState().openLauncher();
    expect(useUIStore.getState().isLauncherOpen).toBe(true);

    useUIStore.getState().closeLauncher();
    expect(useUIStore.getState().isLauncherOpen).toBe(false);
  });

  it('tracks whether onboarding should block the real launcher', () => {
    useUIStore.getState().setOnboardingOpen(true);
    expect(useUIStore.getState().isOnboardingOpen).toBe(true);

    useUIStore.getState().setOnboardingOpen(false);
    expect(useUIStore.getState().isOnboardingOpen).toBe(false);
  });
});
