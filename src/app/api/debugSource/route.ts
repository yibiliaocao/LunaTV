import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

/**
 * 调试自定义分类源
 * 访问示例：
 * GET /api/debugSource?q=91md&type=custom&pg=1
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const type = url.searchParams.get('type') || 'custom';
    const page = Number(url.searchParams.get('pg') || 1);

    if (!query) {
      return NextResponse.json({ error: '缺少 query 参数' }, { status: 400 });
    }

    if (type !== 'custom') {
      return NextResponse.json({ error: 'type 必须为 custom' }, { status: 400 });
    }

    const adminConfig = await getConfig();

    // 查找自定义分类
    const customCategory = adminConfig.CustomCategories.find(c => c.query === query);
    if (!customCategory) {
      return NextResponse.json({ error: `自定义分类 ${query} 未找到` }, { status: 404 });
    }

    // 查找对应源
    const source = adminConfig.SourceConfig.find(s => s.key === query && !s.disabled);
    if (!source) {
      return NextResponse.json({ error: `源 ${query} 未找到或已禁用` }, { status: 404 });
    }

    // 构建请求 URL（支持分页）
    const apiUrl = source.api.replace('{query}', encodeURIComponent(customCategory.query))
                             .replace('{page}', page.toString());

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: source.name,
      category: customCategory.name,
      page,
      apiUrl,
      data,
    });
  } catch (err) {
    console.error('调试接口错误:', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
