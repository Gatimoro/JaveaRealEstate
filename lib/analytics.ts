/**
 * Property Analytics Tracking
 *
 * Tracks views, clicks, and saves for properties
 */

import { createClient } from '@/lib/supabase/client';

export async function trackPropertyView(propertyId: string) {
  const supabase = createClient();

  try {
    // Call RPC function to increment view count
    await supabase.rpc('increment_property_views', {
      property_id_param: propertyId
    });

    // Also log the event for detailed analytics
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('property_analytics').insert({
      property_id: propertyId,
      user_id: user?.id || null,
      event_type: 'view',
    });
  } catch (error) {
    console.error('Error tracking view:', error);
  }
}

export async function trackPropertyClick(propertyId: string) {
  const supabase = createClient();

  try {
    // Call RPC function to increment click count
    await supabase.rpc('increment_property_clicks', {
      property_id_param: propertyId
    });

    // Also log the event
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('property_analytics').insert({
      property_id: propertyId,
      user_id: user?.id || null,
      event_type: 'click',
    });
  } catch (error) {
    console.error('Error tracking click:', error);
  }
}

/**
 * Get property badges based on analytics
 */
export async function getPropertyBadges(): Promise<Record<string, string>> {
  const supabase = createClient();

  try {
    // Get hot properties (top 10 by views)
    const { data: hotProperties } = await supabase
      .from('properties')
      .select('id')
      .eq('status', 'available')
      .order('views_count', { ascending: false })
      .limit(10);

    // Get new properties (less than 2 weeks old)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { data: newProperties } = await supabase
      .from('properties')
      .select('id')
      .eq('status', 'available')
      .gt('created_at', twoWeeksAgo.toISOString());

    // Get most liked properties (top 10 by saves)
    const { data: likedProperties } = await supabase
      .from('properties')
      .select('id')
      .eq('status', 'available')
      .order('saves_count', { ascending: false })
      .limit(10);

    // Build badges map
    const badges: Record<string, string> = {};

    hotProperties?.forEach(p => {
      badges[p.id] = 'hot';
    });

    newProperties?.forEach(p => {
      if (!badges[p.id]) {
        badges[p.id] = 'new';
      }
    });

    likedProperties?.forEach(p => {
      if (!badges[p.id]) {
        badges[p.id] = 'most-liked';
      }
    });

    return badges;
  } catch (error) {
    console.error('Error getting property badges:', error);
    return {};
  }
}
