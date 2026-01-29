import { NextResponse } from 'next/server';
import { getBookmarks, saveBookmarks } from '@/lib/server/storage';
import { BookmarksArraySchema } from '@/lib/schemas';
import { z, ZodError } from 'zod';

/**
 * GET /api/bookmarks
 * 获取所有书签数据
 * @returns {Promise<NextResponse>} 书签列表 JSON
 */
export async function GET() {
  const bookmarks = await getBookmarks();
  return NextResponse.json(bookmarks);
}

/**
 * POST /api/bookmarks
 * 保存书签数据到服务器
 * 包含 Zod 数据验证
 * @param {Request} request 包含书签数组的请求体
 * @returns {Promise<NextResponse>} 成功或错误响应
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookmarks = BookmarksArraySchema.parse(body); // Validation
    await saveBookmarks(bookmarks);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', JSON.stringify(error.errors, null, 2));
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
