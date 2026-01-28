import { NextResponse } from 'next/server';
import { getBookmarks, saveBookmarks } from '@/lib/server/storage';
import { Bookmark } from '@/types';

export async function GET() {
  const bookmarks = await getBookmarks();
  // If no bookmarks file exists, return null (client will use default/local data)
  // Or return empty array? Better to let client decide if it wants to use defaults.
  // But for synchronization, if server has data, we use it. If not, we might initialize it.
  return NextResponse.json(bookmarks);
}

export async function POST(request: Request) {
  try {
    const bookmarks: Bookmark[] = await request.json();
    await saveBookmarks(bookmarks);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save bookmarks' }, { status: 500 });
  }
}
