import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

// POST /api/calendar
export async function POST(req: NextRequest) {
  const body = await req.json();
  // PrismaでDB保存
  const plan = await prisma.calendarPlan.create({
    data: {
      title: body.title,
      description: body.description,
      date: new Date(body.date),
      color: body.color,
    },
  });
  return NextResponse.json({
    message: 'Plan saved',
    plan,
  });
} 