import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL || 'NOT SET',
    DIRECT_URL: process.env.DIRECT_URL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  });
}
