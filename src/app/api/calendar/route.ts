import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import { auth } from '@clerk/nextjs/server';
// POST /api/calendar

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  // PrismaでDB保存
  const plan = await prisma.calendarPlan.create({
    data: {
      title: body.title,
      description: body.description,
      date: new Date(body.date),
      color: body.color,
      userId: userId,
    },
  });
  console.log(plan);
  return NextResponse.json({
    message: 'Plan saved',
    plan,
  });
}

// GET /api/calendar
export async function GET() {
  const plans = await prisma.calendarPlan.findMany({
    orderBy: { date: 'asc' },
  });
  return NextResponse.json({ plans });
} 