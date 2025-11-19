import { NextRequest, NextResponse } from 'next/server';

// Mock data generator for commission forecasting
function generateForecast(timeframe: string) {
  const monthCount = timeframe === '3month' ? 3 : timeframe === '6month' ? 6 : 12;

  // Generate monthly forecasts
  const monthlyForecast = Array.from({ length: monthCount }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const baseProjected = 45000 + (i * 2000) + (Math.random() * 5000);
    const variance = baseProjected * 0.15;

    return {
      month,
      conservative: Math.floor(baseProjected - variance),
      projected: Math.floor(baseProjected),
      optimistic: Math.floor(baseProjected + variance),
      actual: i < 2 ? Math.floor(baseProjected + (Math.random() - 0.5) * variance) : undefined,
    };
  });

  // By Agent forecasts
  const byAgent = [
    { agentName: 'Sarah Johnson', projected: 15000, confidence: 92 },
    { agentName: 'Michael Chen', projected: 12000, confidence: 88 },
    { agentName: 'Emily Rodriguez', projected: 10000, confidence: 85 },
    { agentName: 'David Thompson', projected: 8500, confidence: 82 },
    { agentName: 'Jennifer Martinez', projected: 7000, confidence: 78 },
  ];

  // By Carrier forecasts
  const byCarrier = [
    { carrierName: 'Prudential Financial', projected: 18000, percentage: 34.2 },
    { carrierName: 'New York Life', projected: 14000, percentage: 26.6 },
    { carrierName: 'MassMutual', projected: 10500, percentage: 20.0 },
    { carrierName: 'Northwestern Mutual', projected: 7000, percentage: 13.3 },
    { carrierName: 'Pacific Life', projected: 3100, percentage: 5.9 },
  ];

  // Calculate summary
  const nextMonth = monthlyForecast[0]?.projected || 0;
  const nextQuarter = monthlyForecast.slice(0, 3).reduce((sum, m) => sum + m.projected, 0);
  const nextYear = monthlyForecast.reduce((sum, m) => sum + m.projected, 0);

  return {
    summary: {
      nextMonth,
      nextQuarter,
      nextYear,
      confidenceLevel: 87.5,
    },
    monthlyForecast,
    byAgent,
    byCarrier,
    assumptions: {
      averageCommissionRate: 92.3,
      expectedGrowthRate: 8.5,
      historicalAccuracy: 91.2,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '6month';

    const data = generateForecast(timeframe);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Forecast API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forecast' },
      { status: 500 }
    );
  }
}
