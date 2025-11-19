import { NextRequest, NextResponse } from 'next/server';

// Mock data generator for carrier analytics
function generateCarrierAnalytics(period: string) {
  const carriers = [
    { id: 'CAR-001', name: 'Prudential Financial' },
    { id: 'CAR-002', name: 'New York Life' },
    { id: 'CAR-003', name: 'MassMutual' },
    { id: 'CAR-004', name: 'Northwestern Mutual' },
    { id: 'CAR-005', name: 'Pacific Life' },
    { id: 'CAR-006', name: 'Lincoln Financial' },
    { id: 'CAR-007', name: 'Transamerica' },
    { id: 'CAR-008', name: 'AIG' },
    { id: 'CAR-009', name: 'Nationwide' },
    { id: 'CAR-010', name: 'Principal Financial' },
  ];

  const carrierMetrics = carriers.map((carrier, index) => {
    const basePremium = 800000 - (index * 60000);
    const policyCount = 150 - (index * 12);
    const commissionRate = 85 + Math.random() * 15;

    return {
      carrierId: carrier.id,
      carrierName: carrier.name,
      totalPremium: basePremium + Math.random() * 100000,
      policyCount,
      averagePremium: basePremium / policyCount,
      commissionRate,
      totalCommissions: (basePremium * commissionRate) / 100,
      marketShare: 0, // Will calculate below
      growth: -10 + Math.random() * 40,
      approvalRate: 75 + Math.random() * 20,
      averageUnderwritingTime: 10 + Math.floor(Math.random() * 15),
      productTypes: {
        life: 35 + Math.random() * 25,
        annuity: 30 + Math.random() * 20,
        term: 25 + Math.random() * 20,
      },
      topProducts: [
        {
          name: 'Term Life 20',
          premium: basePremium * 0.4,
          count: Math.floor(policyCount * 0.4),
        },
        {
          name: 'Whole Life',
          premium: basePremium * 0.35,
          count: Math.floor(policyCount * 0.35),
        },
        {
          name: 'Fixed Annuity',
          premium: basePremium * 0.25,
          count: Math.floor(policyCount * 0.25),
        },
      ],
    };
  });

  // Calculate market share
  const totalPremium = carrierMetrics.reduce((sum, c) => sum + c.totalPremium, 0);
  carrierMetrics.forEach(carrier => {
    carrier.marketShare = (carrier.totalPremium / totalPremium) * 100;
  });

  // Sort by total premium
  carrierMetrics.sort((a, b) => b.totalPremium - a.totalPremium);

  const totalCarriers = carrierMetrics.length;
  const averageApprovalRate = carrierMetrics.reduce((sum, c) => sum + c.approvalRate, 0) / totalCarriers;
  const topCarrierShare = carrierMetrics[0]?.marketShare || 0;

  return {
    summary: {
      totalCarriers,
      totalPremium: Math.round(totalPremium),
      averageApprovalRate,
      topCarrierShare,
    },
    carriers: carrierMetrics,
    period,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'ytd';

    const data = generateCarrierAnalytics(period);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Carrier analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carrier analytics' },
      { status: 500 }
    );
  }
}
