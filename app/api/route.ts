import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const secret = request.headers.get('x-revalidate-secret');

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 🔥 Nuke everything
  revalidatePath('/', 'layout');

  return NextResponse.json({
    ok: true,
    message: 'Cache cleared. Fresh shii coming in hot.',
  });
}
