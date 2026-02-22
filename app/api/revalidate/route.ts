import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

    // Always revalidate all category pages so ISR cache is cleared regardless of tag support
    revalidatePath('/');
    revalidatePath('/categoria/venta');
    revalidatePath('/categoria/alquiler');
    revalidatePath('/categoria/obra-nueva');
    revalidatePath('/buscar');

    // Refresh materialized view (card_properties) via service role
    let viewRefreshed = false;
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/refresh_card_properties`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: '{}',
        });
        viewRefreshed = rpcRes.ok;
      } catch {
        // Non-fatal: view refresh failed, log but don't fail the request
        console.error('Failed to refresh card_properties materialized view');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cache revalidated successfully',
      revalidated,
      viewRefreshed,
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
