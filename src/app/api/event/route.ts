import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseClient';

/**
 * API route to fetch all tasks.
 * GET /api/tasks
 */
export async function GET() {
  const { data: events, error } = await supabaseClient
    .from('events')
    .select('*')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(events);
}

/**
 * API route to create a new task.
 * POST /api/tasks
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const event = {
      title: body.title,
      description: body.description,
      start_time: new Date(body.start_time).toISOString(),
      end_time: new Date(body.end_time).toISOString(),
      user_id: 'default-user'
    };

    const { data, error } = await supabaseClient
      .from('events')
      .insert([event])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * API route to delete a task.
 * DELETE /api/tasks
 */
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    const { error } = await supabaseClient
      .from('events')
      .delete()
      .eq('id', id);

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