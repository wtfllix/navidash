'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clipboard,
  FileText,
  GripVertical,
  Globe2,
  Link2,
  MousePointer2,
  NotebookPen,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import BookmarkTextImporter from '@/components/bookmarks/BookmarkTextImporter';
import { createBookmarkImportData, mergeBookmarkImports } from '@/lib/bookmarkImport';
import { shouldShowOnboarding } from '@/lib/onboarding';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useToastStore } from '@/store/useToastStore';
import { useUIStore } from '@/store/useUIStore';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { usePathname, useRouter } from '@/navigation';
import { Bookmark } from '@/types';

type OnboardingStep = 'bookmarks' | 'keyboard' | 'canvas';
const PENDING_BOOKMARKS_KEY = 'navidash-onboarding-bookmarks';
const ONBOARDING_STEP_KEY = 'navidash-onboarding-step';
const KEYBOARD_DEMO_FRAMES = [
  { query: '', active: false, submitted: false, scenario: 'match' },
  { query: '', active: true, submitted: false, scenario: 'match' },
  { query: 'g', active: true, submitted: false, scenario: 'match' },
  { query: 'gi', active: true, submitted: false, scenario: 'match' },
  { query: 'git', active: true, submitted: false, scenario: 'match' },
  { query: 'gith', active: true, submitted: false, scenario: 'match' },
  { query: 'githu', active: true, submitted: false, scenario: 'match' },
  { query: 'github', active: true, submitted: false, scenario: 'match' },
  { query: 'github', active: true, submitted: true, scenario: 'match' },
  { query: 'github', active: true, submitted: true, scenario: 'match' },
  { query: '', active: false, submitted: false, scenario: 'learned' },
  { query: '', active: true, submitted: false, scenario: 'learned' },
  { query: 'c', active: true, submitted: false, scenario: 'learned' },
  { query: 'c', active: true, submitted: false, scenario: 'learned' },
  { query: 'c', active: true, submitted: false, scenario: 'learned' },
  { query: 'c', active: true, submitted: false, scenario: 'learned' },
] as const;
const KEYBOARD_LEARNED_ITEMS = [
  { id: 'chatgpt', title: 'ChatGPT', url: 'https://chatgpt.com/', visits: 42 },
  { id: 'claude', title: 'Claude', url: 'https://claude.ai/', visits: 18 },
  { id: 'canva', title: 'Canva', url: 'https://www.canva.com/', visits: 7 },
];

function readPendingBookmarks(): Bookmark[] {
  if (typeof window === 'undefined') return [];

  try {
    const value = JSON.parse(sessionStorage.getItem(PENDING_BOOKMARKS_KEY) ?? '[]');
    return Array.isArray(value) ? (value as Bookmark[]) : [];
  } catch {
    return [];
  }
}

function readOnboardingStep(): OnboardingStep {
  if (typeof window === 'undefined') return 'bookmarks';
  const step = sessionStorage.getItem(ONBOARDING_STEP_KEY);
  return step === 'keyboard' || step === 'canvas' ? step : 'bookmarks';
}

interface BookmarkImportStepProps {
  pendingBookmarks: Bookmark[];
  onAdd: (bookmarks: Bookmark[]) => void;
  onContinue: () => void;
}

function BookmarkImportStep({
  pendingBookmarks,
  onAdd,
  onContinue,
}: BookmarkImportStepProps) {
  const t = useTranslations('Onboarding');
  const tb = useTranslations('Bookmarks');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [fileStatus, setFileStatus] = useState<string | null>(null);
  const prompt = t('ai_prompt');

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('error');
    }
  };

  const handleHtmlFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = createBookmarkImportData(
        String(loadEvent.target?.result ?? ''),
        `onboarding-html-${Date.now()}`
      );

      if (result.count === 0) {
        setFileStatus(t('html_empty'));
        return;
      }

      const before = pendingBookmarks.length;
      const merged = mergeBookmarkImports(pendingBookmarks, result.bookmarks);
      onAdd(result.bookmarks);
      setFileStatus(t('html_added', { count: merged.length - before }));
    };
    reader.onerror = () => setFileStatus(t('html_empty'));
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="w-full">
      <h1
        id="onboarding-title"
        tabIndex={-1}
        className="text-xl font-semibold tracking-tight text-blue-600 outline-none sm:text-2xl"
      >
        {t('step_one')}
      </h1>
      <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
        {t('bookmark_import_hint')}
      </p>

      <div className="mt-4 grid w-full items-stretch gap-8 lg:h-[clamp(32rem,calc(100vh-13rem),38rem)] lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
        <div className="min-h-[26rem] min-w-0 lg:min-h-0">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Sparkles size={14} className="text-blue-400" />
                {t('prompt_title')}
              </div>
              <button
                type="button"
                onClick={() => void copyPrompt()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
              >
                {copyState === 'copied' ? <Check size={13} /> : <Clipboard size={13} />}
                {copyState === 'copied'
                  ? t('prompt_copied')
                  : copyState === 'error'
                    ? t('prompt_copy_failed')
                    : t('prompt_copy')}
              </button>
            </div>
            <pre
              className="hover-scrollbar min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap px-4 py-4 text-xs leading-6 text-slate-300"
              tabIndex={0}
            >
              {prompt}
            </pre>
          </div>
        </div>

        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/90 p-4 shadow-[0_22px_60px_rgba(15,23,42,0.09)] sm:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileText size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{t('paste_title')}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {t('paste_description')}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <BookmarkTextImporter
              existingUrls={pendingBookmarks.map((bookmark) => bookmark.url)}
              actionLabel={t('paste_action')}
              compact
              onImport={(items) => {
                onAdd(items);
                return true;
              }}
            />
          </div>

          <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            {t('or')}
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,text/html"
            onChange={handleHtmlFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
          >
            <Upload size={18} className="shrink-0 text-slate-500" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-800">
                {t('html_title')}
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                {fileStatus ?? t('html_description')}
              </span>
            </span>
            <span className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              {tb('import')}
            </span>
          </button>

          <div className="mt-auto flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {t('pending_count', { count: pendingBookmarks.length })}
              </p>
              <p className="mt-1 text-xs text-slate-500">{t('pending_hint')}</p>
            </div>
            <button
              type="button"
              onClick={onContinue}
              className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {pendingBookmarks.length > 0 ? t('continue_action') : t('skip_action')}
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface KeyboardLauncherStepProps {
  pendingBookmarks: Bookmark[];
  onBack: () => void;
  onContinue: () => void;
}

function KeyboardLauncherStep({
  pendingBookmarks,
  onBack,
  onContinue,
}: KeyboardLauncherStepProps) {
  const t = useTranslations('Onboarding');
  const [frameIndex, setFrameIndex] = useState(0);
  const frame = KEYBOARD_DEMO_FRAMES[frameIndex];
  const { query, active: isActive, submitted, scenario } = frame;
  const fallbackItems = [
    { id: 'github', title: 'GitHub', url: 'https://github.com/' },
    { id: 'youtube', title: 'YouTube', url: 'https://www.youtube.com/' },
    { id: 'openai', title: 'OpenAI', url: 'https://openai.com/' },
  ];
  const sourceItems =
    scenario === 'learned'
      ? KEYBOARD_LEARNED_ITEMS
      : mergeBookmarkImports(pendingBookmarks.slice(0, 6), fallbackItems);
  const normalizedQuery = query.trim().toLowerCase();
  const matchedItems = sourceItems
    .filter((item) =>
      `${item.title} ${item.url}`.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 3);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFrameIndex(KEYBOARD_DEMO_FRAMES.length - 1);
      return;
    }

    const interval = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % KEYBOARD_DEMO_FRAMES.length);
    }, 260);
    return () => window.clearInterval(interval);
  }, []);

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4">
        <h1
          id="onboarding-title"
          tabIndex={-1}
          className="text-xl font-semibold tracking-tight text-blue-600 outline-none sm:text-2xl"
        >
          {t('step_two')}
        </h1>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={15} />
          {t('back_to_bookmarks')}
        </button>
      </div>
      <div className="mt-2">
        <p className="text-sm leading-6 text-slate-500">{t('keyboard_footer')}</p>
        <p className="text-xs leading-5 text-slate-400">{t('keyboard_learning')}</p>
      </div>

      <div className="mt-5 flex h-[clamp(29rem,calc(100vh-13rem),35rem)] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white/85 shadow-[0_22px_60px_rgba(15,23,42,0.09)]">
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-slate-50/75 px-5 py-8">
          <div className="onboarding-demo-grid" aria-hidden="true" />
          <div className="relative z-10 w-full max-w-2xl">
            <div
              className={`overflow-hidden rounded-[1.6rem] border bg-white/95 shadow-[0_24px_65px_rgba(15,23,42,0.16)] transition-all ${
                isActive
                  ? 'border-blue-300 ring-4 ring-blue-100/70'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
                <Search size={20} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                <span className={`min-w-0 flex-1 text-base ${query ? 'text-slate-900' : 'text-slate-400'}`}>
                  {query || t('keyboard_placeholder')}
                </span>
                <kbd className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-400">
                  ESC
                </kbd>
              </div>

              <div className="p-2">
                {(matchedItems.length > 0 ? matchedItems : []).map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                      index === 0 && isActive ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                      {item.title.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-slate-400">
                        {getHostname(item.url)}
                      </span>
                    </span>
                    {scenario === 'learned' && 'visits' in item ? (
                      <span
                        className={`text-[11px] font-semibold ${
                          index === 0 ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      >
                        {index === 0
                          ? t('keyboard_most_visited', { count: item.visits })
                          : t('keyboard_visits', { count: item.visits })}
                      </span>
                    ) : index === 0 && isActive ? (
                      <span className="text-[11px] font-semibold text-blue-600">
                        {submitted ? t('keyboard_opening') : t('keyboard_open')}
                      </span>
                    ) : null}
                  </div>
                ))}
                {matchedItems.length === 0 && query && (
                  <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-3 py-3">
                    <Search size={18} className="text-blue-500" />
                    <span className="text-sm font-semibold text-slate-700">
                      {t('keyboard_search_web', { query })}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onContinue}
            className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t('continue_action')}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DragDemo() {
  const t = useTranslations('Onboarding');

  return (
    <div
      className="onboarding-demo-shell onboarding-demo-shell-full mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col"
      role="img"
      aria-label={t('demo_label')}
    >
      <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        <span className="text-xs font-semibold text-slate-500">{t('demo_canvas')}</span>
        <span className="w-10" aria-hidden="true" />
      </div>

      <div className="onboarding-demo-stage min-h-0 flex-1" aria-hidden="true">
        <div className="onboarding-demo-grid" />
        <div className="absolute left-[6%] top-7 w-[42%] rounded-2xl bg-white/95 p-4 shadow-[0_9px_25px_rgba(15,23,42,0.09)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Today
            </span>
            <CalendarDays size={14} className="text-blue-500" />
          </div>
          <div className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">09:41</div>
          <div className="mt-1 text-xs text-slate-500">Tuesday · Clear</div>
        </div>
        <div className="absolute bottom-[5.7rem] left-[6%] w-[48%] rounded-2xl bg-white/95 px-4 py-3 shadow-[0_9px_25px_rgba(15,23,42,0.07)]">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Frequent links
          </div>
          <div className="flex gap-2">
            {['G', 'N', 'L'].map((label) => (
              <span
                key={label}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[11px] font-bold text-slate-600"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="onboarding-drop-target">
          <span>{t('demo_drop_here')}</span>
        </div>
        <div className="onboarding-drag-widget">
          <div className="flex items-center justify-between">
            <NotebookPen size={16} />
            <GripVertical size={14} className="opacity-45" />
          </div>
          <span className="mt-3 block text-xs font-semibold">{t('demo_memo')}</span>
          <span className="mt-1 block h-1.5 w-14 rounded-full bg-amber-200" />
        </div>
        <MousePointer2 className="onboarding-demo-pointer" size={27} fill="white" />
        <div className="onboarding-demo-dock">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500 text-white">
              <Sparkles size={14} />
            </span>
            <span className="hidden text-xs font-semibold text-slate-600 sm:inline">
              {t('demo_library')}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-[11px] font-semibold text-slate-500">
              <Link2 size={13} /> Links
            </span>
            <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-100 px-3 text-[11px] font-semibold text-amber-800">
              <NotebookPen size={13} /> Memo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CanvasLayoutStepProps {
  isStarting: boolean;
  onBack: () => void;
  onFinish: () => void;
}

function CanvasLayoutStep({ isStarting, onBack, onFinish }: CanvasLayoutStepProps) {
  const t = useTranslations('Onboarding');

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4">
        <h1
          id="onboarding-title"
          tabIndex={-1}
          className="text-xl font-semibold tracking-tight text-blue-600 outline-none sm:text-2xl"
        >
          {t('step_three')}
        </h1>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={15} />
          {t('back_to_keyboard')}
        </button>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-500">{t('canvas_hint')}</p>

      <div className="mt-5 flex h-[clamp(25rem,calc(100vh-12.5rem),36rem)] min-h-0 flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.09)]">
        <div className="min-h-0 flex-1 bg-slate-50/75 p-3 sm:p-5">
          <DragDemo />
        </div>
        <div className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onFinish}
            disabled={isStarting}
            className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
          >
            {isStarting ? t('starting') : t('start_action')}
            {!isStarting && (
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FirstRunGuide() {
  const t = useTranslations('Onboarding');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const guideRef = useRef<HTMLElement>(null);
  const [, startLanguageTransition] = useTransition();
  const [step, setStep] = useState<OnboardingStep>(readOnboardingStep);
  const [pendingBookmarks, setPendingBookmarks] = useState<Bookmark[]>(readPendingBookmarks);
  const [sessionActive, setSessionActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [switchingLocale, setSwitchingLocale] = useState<string | null>(null);
  const {
    isSnapshotLoaded,
    revision,
    layoutsByMode,
    widgetConfigs,
    bookmarks,
    importBookmarks,
    saveWidgetConfigs,
  } = useWidgetStore();
  const openWidgetStore = useSidebarStore((state) => state.open);
  const setEditing = useUIStore((state) => state.setEditing);
  const setOnboardingOpen = useUIStore((state) => state.setOnboardingOpen);
  const addToast = useToastStore((state) => state.addToast);
  const { hasFetchedSettings, fetchSettings, setLanguage, saveSettings } = useSettingsStore();

  const shouldOpen = shouldShowOnboarding({
    isSnapshotLoaded,
    revision,
    layoutsByMode,
    configCount: widgetConfigs.length,
    bookmarkCount: bookmarks.length,
  });

  useEffect(() => {
    if (shouldOpen) setSessionActive(true);
  }, [shouldOpen]);

  useEffect(() => {
    const isOpen = shouldOpen || sessionActive;
    setOnboardingOpen(isOpen);
    return () => setOnboardingOpen(false);
  }, [sessionActive, setOnboardingOpen, shouldOpen]);

  useEffect(() => {
    if (pendingBookmarks.length === 0) {
      sessionStorage.removeItem(PENDING_BOOKMARKS_KEY);
      return;
    }
    sessionStorage.setItem(PENDING_BOOKMARKS_KEY, JSON.stringify(pendingBookmarks));
  }, [pendingBookmarks]);

  useEffect(() => {
    sessionStorage.setItem(ONBOARDING_STEP_KEY, step);
  }, [step]);

  useEffect(() => {
    setSwitchingLocale(null);
  }, [locale]);

  useEffect(() => {
    const guide = guideRef.current;
    if (!guide || (!shouldOpen && !sessionActive)) return;

    guide.querySelector<HTMLElement>('#onboarding-title')?.focus();

    const keepFocusInsideGuide = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = Array.from(
        guide.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.offsetParent !== null);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (!guide.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && (activeElement === first || activeElement === guide)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (activeElement?.getAttribute('id') === 'onboarding-title' && event.shiftKey) {
        event.preventDefault();
        last.focus();
      }
    };

    guide.addEventListener('keydown', keepFocusInsideGuide);
    return () => guide.removeEventListener('keydown', keepFocusInsideGuide);
  }, [sessionActive, shouldOpen, step]);

  if (!shouldOpen && !sessionActive) return null;

  const addPendingBookmarks = (items: Bookmark[]) => {
    setPendingBookmarks((current) => mergeBookmarkImports(current, items));
  };

  const persistLanguage = async (nextLocale: string) => {
    if (!hasFetchedSettings) {
      await fetchSettings(true);
    }
    if (!useSettingsStore.getState().hasFetchedSettings) {
      addToast(t('language_save_failed'), 'error');
      return false;
    }

    setLanguage(nextLocale);
    if (!(await saveSettings())) {
      addToast(t('language_save_failed'), 'error');
      return false;
    }
    return true;
  };

  const switchLanguage = async (nextLocale: 'zh' | 'en') => {
    if (nextLocale === locale || switchingLocale) return;
    setSwitchingLocale(nextLocale);
    if (!(await persistLanguage(nextLocale))) {
      setSwitchingLocale(null);
      return;
    }

    startLanguageTransition(() => {
      // @ts-ignore next-intl narrows locale at runtime through the routing config.
      router.replace(pathname, { locale: nextLocale });
    });
  };

  const finishOnboarding = async () => {
    if (isStarting) return;
    setIsStarting(true);

    if (!(await persistLanguage(locale))) {
      setIsStarting(false);
      return;
    }

    if (pendingBookmarks.length > 0) {
      importBookmarks(pendingBookmarks);
    }
    const saved = await saveWidgetConfigs();

    if (!saved) {
      addToast(t('save_failed'), 'error');
      setIsStarting(false);
      return;
    }

    setSessionActive(false);
    setOnboardingOpen(false);
    sessionStorage.removeItem(PENDING_BOOKMARKS_KEY);
    sessionStorage.removeItem(ONBOARDING_STEP_KEY);
    setEditing(true);
    openWidgetStore();
  };

  return (
    <section
      ref={guideRef}
      className="fixed inset-0 z-[60] overflow-y-auto bg-slate-50/96 px-5 py-6 backdrop-blur-xl sm:px-8 lg:overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-label={
        step === 'bookmarks' ? t('step_one') : step === 'keyboard' ? t('step_two') : t('step_three')
      }
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col justify-center">
        <div className="mb-6 flex items-center justify-between gap-5">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--primary-color))]">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[rgb(var(--primary-color))] text-white shadow-lg shadow-blue-500/20">
              <Sparkles size={17} />
            </span>
            NaviDash
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center rounded-xl border border-slate-200 bg-white/80 p-1 shadow-sm"
              role="group"
              aria-label={t('language_switcher')}
            >
              <Globe2 size={14} className="mx-2 text-slate-400" aria-hidden="true" />
              {[
                { id: 'zh' as const, label: '中文' },
                { id: 'en' as const, label: 'English' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void switchLanguage(item.id)}
                  disabled={!!switchingLocale}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    locale === item.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  } disabled:cursor-wait disabled:opacity-60`}
                  aria-pressed={locale === item.id}
                >
                  {switchingLocale === item.id ? '…' : item.label}
                </button>
              ))}
            </div>
            <div className="hidden items-center gap-2 text-xs font-semibold text-slate-400 sm:flex">
              <span className={step === 'bookmarks' ? 'text-blue-600' : 'text-emerald-600'}>
                1
              </span>
              <span className="h-px w-8 bg-slate-300" />
              <span
                className={
                  step === 'keyboard'
                    ? 'text-blue-600'
                    : step === 'canvas'
                      ? 'text-emerald-600'
                      : ''
                }
              >
                2
              </span>
              <span className="h-px w-8 bg-slate-300" />
              <span className={step === 'canvas' ? 'text-blue-600' : ''}>3</span>
            </div>
          </div>
        </div>

        {step === 'bookmarks' ? (
          <BookmarkImportStep
            pendingBookmarks={pendingBookmarks}
            onAdd={addPendingBookmarks}
            onContinue={() => setStep('keyboard')}
          />
        ) : step === 'keyboard' ? (
          <KeyboardLauncherStep
            pendingBookmarks={pendingBookmarks}
            onBack={() => setStep('bookmarks')}
            onContinue={() => setStep('canvas')}
          />
        ) : (
          <CanvasLayoutStep
            isStarting={isStarting}
            onBack={() => setStep('keyboard')}
            onFinish={() => void finishOnboarding()}
          />
        )}
      </div>
    </section>
  );
}
