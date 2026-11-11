import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Use service role key for server-side operations (bypasses RLS and egress limits)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzvojposgvdjwriivryp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  { auth: { persistSession: false } }
);

// GET /api/channels - fetch all channels
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('channels')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ channels: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/channels - create or update a channel
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...payload } = body;

    if (id) {
      // Update existing channel
      const { error } = await supabaseAdmin.from('channels').update(payload).eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true, action: 'updated' });
    } else {
      // Insert new channel
      const { error } = await supabaseAdmin.from('channels').insert([payload]);
      if (error) throw error;
      return NextResponse.json({ success: true, action: 'created' });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/channels - delete a channel
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await supabaseAdmin.from('channels').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/channels - reorder channels (update order_index for multiple)
export async function PATCH(req: NextRequest) {
  try {
    const { updates } = await req.json(); // [{id, order_index}, ...]
    if (!Array.isArray(updates)) return NextResponse.json({ error: 'updates array required' }, { status: 400 });

    const promises = updates.map(({ id, order_index }: any) =>
      supabaseAdmin.from('channels').update({ order_index }).eq('id', id)
    );
    await Promise.all(promises);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
