import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';

// Naive in-memory rate limit (per instance)
const ipUserToCount = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const rec = ipUserToCount.get(key);
  if (!rec || now > rec.resetAt) {
    ipUserToCount.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (rec.count >= limit) return false;
  rec.count += 1;
  return true;
}

const eventSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional().default(''),
  start_time: z.string().refine(v => !isNaN(new Date(v).getTime()), 'Invalid start_time'),
  end_time: z.string().refine(v => !isNaN(new Date(v).getTime()), 'Invalid end_time'),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit per user+ip
    const ip = request.headers.get('x-forwarded-for') || 'local';
    const bucket = `${userId}:${ip}`;
    if (!rateLimit(bucket, 60, 60_000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const parsed = eventSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const { title, description, start_time, end_time } = parsed.data;

    const start = new Date(start_time);
    const end = new Date(end_time);
    if (!(end > start)) {
      return NextResponse.json({ error: 'end_time must be after start_time' }, { status: 400 });
    }

    const event = {
      title,
      description,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      user_id: userId,
    };

    // Expect RLS to allow insert when user_id = auth.uid()
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST handler:', error);
    const message = (error as any)?.message || 'Internal Server Error';
    return NextResponse.json({ error: message, details: error }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'local';
    const bucket = `${userId}:${ip}:del`;
    if (!rateLimit(bucket, 60, 60_000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { id } = await request.json();

    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Ensure users can only delete their own events

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 