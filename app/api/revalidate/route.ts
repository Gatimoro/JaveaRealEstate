import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const secret = request.headers.get('x-revalidate-secret');

    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body to get optional tags or paths
    const body = await request.json().catch(() => ({}));
    const { tags, paths, clearAll } = body;

    let revalidated = [];

    // Option 1: Revalidate specific tags (recommended for property updates)
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        revalidateTag(tag);
        revalidated.push(`tag:${tag}`);
      }
    }

    // Option 2: Revalidate specific paths
    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        revalidatePath(path);
        revalidated.push(`path:${path}`);
      }
    }

    // Option 3: Clear all property caches (default behavior)
    if (clearAll || (!tags && !paths)) {
      revalidateTag('properties');
      revalidated.push('tag:properties (all property data)');
    }

    return NextResponse.json({
      success: true,
      message: 'Cache revalidated successfully',
      revalidated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
