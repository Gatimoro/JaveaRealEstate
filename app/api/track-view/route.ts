import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/track-view
 *
 * Lightweight fire-and-forget endpoint called via navigator.sendBeacon.
 * Calls the DB function record_property_view() which:
 *   - Deduplicates: logged-in users → 1 view per property per day
 *                   anonymous users  → 1 view per localStorage session UUID per property (ever)
 *   - Inserts into property_analytics
 *   - Increments properties.views_count by 1 (only if new unique view)
 *
 * No heavy aggregation — just an indexed lookup + conditional UPDATE.
 * Badge computation reads views_count at ISR rebuild time (every 5 min), unchanged.
 */
export async function POST(req: NextRequest) {
  try {
    const { propertyId, sessionId } = await req.json();

    if (!propertyId || typeof propertyId !== 'string') {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.rpc('record_property_view', {
      p_property_id: propertyId,
      p_user_id: user?.id ?? null,
      p_session_id: user ? null : (typeof sessionId === 'string' ? sessionId : null),
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Non-fatal — analytics failure should never surface to users
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
