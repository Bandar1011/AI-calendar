import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API route to fetch all tasks.
 * GET /api/tasks
 */
export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: { date: 'asc' },
  });
  return NextResponse.json(tasks);
}

/**
 * API route to create a new task.
 * POST /api/tasks
 */
export async function POST(request: Request) {
  const { description, date } = await request.json();
  const newTask = await prisma.task.create({
    data: {
      description,
      date: new Date(date),
    },
  });
  return NextResponse.json(newTask, { status: 201 });
}

/**
 * API route to delete a task.
 * DELETE /api/tasks
 */
export async function DELETE(request: Request) {
  const { id } = await request.json();
  await prisma.task.delete({
    where: { id },
  });
  return new NextResponse(null, { status: 204 }); // No Content
} 