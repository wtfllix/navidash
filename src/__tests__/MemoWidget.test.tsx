import { render, screen } from '@testing-library/react';
import MemoWidget from '@/components/widgets/MemoWidget';
import type { WidgetOfType } from '@/types';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const createWidget = (content: string): WidgetOfType<'memo'> => ({
  id: 'memo-1',
  type: 'memo',
  size: { w: 2, h: 2 },
  position: { x: 0, y: 0 },
  config: {
    content,
  },
});

describe('MemoWidget', () => {
  it('在外部同步更新后刷新展示内容', () => {
    const { rerender } = render(<MemoWidget widget={createWidget('旧内容')} />);

    expect(screen.getByText('旧内容')).toBeInTheDocument();

    rerender(<MemoWidget widget={createWidget('同步后的新内容')} />);

    expect(screen.getByText('同步后的新内容')).toBeInTheDocument();
  });
});
