import { NextResponse } from 'next/server';
import { getWidgets, saveWidgets, getWidgetsLastModified } from '@/lib/server/storage';
import { WidgetsArraySchema } from '@/lib/schemas';
import { z, ZodError } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * GET /api/widgets
 * 获取所有小组件配置数据
 * @returns {Promise<NextResponse>} 小组件列表 JSON
 */
export async function GET() {
  const widgets = await getWidgets();
  const lastModified = await getWidgetsLastModified();

  return NextResponse.json(widgets, {
    headers: {
      'X-Data-Version': lastModified.toString(),
    },
  });
}

/**
 * POST /api/widgets
 * 保存小组件配置到服务器
 * 包含 Zod 数据验证
 * @param {Request} request 包含小组件数组的请求体
 * @returns {Promise<NextResponse>} 成功或错误响应
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const widgets = WidgetsArraySchema.parse(body); // Validation
    await saveWidgets(widgets);
    const lastModified = await getWidgetsLastModified();
    return NextResponse.json({ success: true, version: lastModified });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', JSON.stringify(error.errors, null, 2));
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
