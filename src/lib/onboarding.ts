import { WidgetLayoutsByMode } from '@/types';

interface OnboardingState {
  isSnapshotLoaded: boolean;
  revision?: number;
  layoutsByMode: WidgetLayoutsByMode;
  configCount: number;
  bookmarkCount: number;
}

export function shouldShowOnboarding(state: OnboardingState) {
  return (
    state.isSnapshotLoaded &&
    state.revision === 0 &&
    state.layoutsByMode.desktop.length === 0 &&
    state.layoutsByMode.mobile.length === 0 &&
    state.configCount === 0 &&
    state.bookmarkCount === 0
  );
}
