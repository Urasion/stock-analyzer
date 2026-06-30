import { NextResponse } from 'next/server';
import { getMacroData } from '@/lib/macro';

export async function GET() {
  try {
    const data = await getMacroData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API /api/market/macro failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch macroeconomic data: ${message}` },
      { status: 500 }
    );
  }
}
