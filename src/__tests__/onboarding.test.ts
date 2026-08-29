import { shouldShowOnboarding } from '@/lib/onboarding';

const emptyLayouts = { desktop: [], mobile: [] };

describe('first-run onboarding', () => {
  it('只在服务端确认全新部署后显示', () => {
    expect(
      shouldShowOnboarding({
        isSnapshotLoaded: true,
        revision: 0,
        layoutsByMode: emptyLayouts,
        configCount: 0,
        bookmarkCount: 0,
      })
    ).toBe(true);
  });

  it.each([
    { isSnapshotLoaded: false, revision: undefined, configCount: 0, bookmarkCount: 0 },
    { isSnapshotLoaded: true, revision: 1, configCount: 0, bookmarkCount: 0 },
    { isSnapshotLoaded: true, revision: 0, configCount: 1, bookmarkCount: 0 },
    { isSnapshotLoaded: true, revision: 0, configCount: 0, bookmarkCount: 1 },
  ])('已有数据或尚未加载时不显示：%p', (state) => {
    expect(shouldShowOnboarding({ ...state, layoutsByMode: emptyLayouts })).toBe(false);
  });
});
