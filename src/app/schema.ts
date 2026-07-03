import { z } from 'zod';

export const stockAnalysisSchema = z.object({
  financials: z.object({
    revenue: z.object({
      actual: z.string(),
      status: z.enum(['Beat', 'In-line', 'Miss']),
      growthYoY: z.string(),
    }),
    eps: z.object({
      actual: z.string(),
      status: z.enum(['Beat', 'In-line', 'Miss']),
    }),
    guidance: z.object({
      status: z.enum(['Raised', 'Maintained', 'Lowered', 'None']),
      details: z.string(),
    }),
  }),
  context: z.object({
    keyDrivers: z.array(z.string()),
    riskFactors: z.array(z.string()),
    shareholderReturn: z.string().optional(),
  }),
  judgment: z.object({
    sentiment: z.enum(['STRONG BUY', 'BUY', 'HOLD', 'SELL', 'STRONG SELL']),
    confidenceScore: z.number(),
    managementTone: z.enum(['Confident', 'Neutral', 'Cautious']),
    oneLineSummary: z.string(),
    positionStrategy: z.object({
      recommendation: z.enum(['BUY_MORE', 'HOLD', 'REDUCE', 'SELL_ALL', 'WAIT_FOR_ENTRY']),
      buyMorePrice: z.string(),
      longTermTarget: z.string(),
      reasoning: z.string(),
    }).optional(),
  }),
});
