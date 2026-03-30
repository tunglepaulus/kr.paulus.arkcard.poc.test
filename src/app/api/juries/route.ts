import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/juries
 * Fetch all distinct jury experiences from the database.
 * Returns unique event names with their associated roles and years.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('jury_experience')
      .select('id, event_name, role, years')
      .order('event_name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    // Map snake_case DB columns to camelCase for the client
    const mapped = (data || []).map((item: any) => ({
      id: item.id,
      eventName: item.event_name,
      role: item.role,
      years: item.years || [],
    }));

    // Deduplicate by event_name — aggregate unique years and roles
    const eventMap = new Map<
      string,
      { eventName: string; roles: Set<string>; years: Set<number> }
    >();

    for (const item of mapped) {
      const key = item.eventName.toLowerCase().trim();
      if (!eventMap.has(key)) {
        eventMap.set(key, {
          eventName: item.eventName,
          roles: new Set<string>(),
          years: new Set<number>(),
        });
      }
      const entry = eventMap.get(key)!;
      if (item.role) entry.roles.add(item.role);
      for (const y of item.years) {
        entry.years.add(y);
      }
    }

    const deduplicated = Array.from(eventMap.values()).map((entry) => ({
      eventName: entry.eventName,
      roles: Array.from(entry.roles).sort(),
      years: Array.from(entry.years).sort((a, b) => b - a),
    }));

    return NextResponse.json({ success: true, data: deduplicated });
  } catch (error) {
    console.error('Error in GET /api/juries:', error);
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

