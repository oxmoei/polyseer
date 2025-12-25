import { NextRequest, NextResponse } from 'next/server';
import { runUnifiedForecastPipeline } from '@/lib/agents/orchestrator';
import { parseMarketUrl, isValidMarketUrl } from '@/lib/tools/market-url-parser';

export const maxDuration = 300; // Vercel Pro 最大支持 300 秒

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      polymarketSlug, // Legacy support
      marketUrl, // New unified support
      drivers = [],
      historyInterval = '1d',
      withBooks = true,
      withTrades = false,
    } = body;

    // Determine which parameter was provided and validate
    let finalMarketUrl: string;

    if (marketUrl) {
      if (typeof marketUrl !== 'string' || !marketUrl) {
        return NextResponse.json(
          { error: 'marketUrl must be a non-empty string' },
          { status: 400 }
        );
      }

      if (!isValidMarketUrl(marketUrl)) {
        const parsed = parseMarketUrl(marketUrl);
        return NextResponse.json(
          { error: parsed.error || 'Invalid market URL. Only Polymarket and Kalshi URLs are supported.' },
          { status: 400 }
        );
      }

      finalMarketUrl = marketUrl;
    } else if (polymarketSlug) {
      if (typeof polymarketSlug !== 'string' || !polymarketSlug) {
        return NextResponse.json(
          { error: 'polymarketSlug must be a non-empty string' },
          { status: 400 }
        );
      }

      finalMarketUrl = `https://polymarket.com/event/${polymarketSlug}`;
    } else {
      return NextResponse.json(
        { error: 'Either marketUrl or polymarketSlug is required' },
        { status: 400 }
      );
    }

    // Create a ReadableStream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (data: any, event?: string) => {
          const eventData = event ? `event: ${event}\n` : '';
          const payload = `${eventData}data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        };

        try {
          sendEvent({ type: 'connected', message: 'Starting analysis...' });

          const onProgress = (step: string, details: any) => {
            sendEvent({
              type: 'progress',
              step,
              details,
              timestamp: new Date().toISOString()
            }, 'progress');
          };

          const startTime = Date.now();

          const forecastCard = await runUnifiedForecastPipeline({
            marketUrl: finalMarketUrl,
            drivers,
            historyInterval,
            withBooks,
            withTrades,
            onProgress,
          });

          const durationSeconds = Math.round((Date.now() - startTime) / 1000);

          sendEvent({
            type: 'complete',
            forecast: forecastCard,
            durationSeconds,
            timestamp: new Date().toISOString()
          }, 'complete');

        } catch (error) {
          console.error('Error in forecast API:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

          sendEvent({
            type: 'error',
            error: errorMessage,
            details: error instanceof Error ? error.stack : 'No stack trace available',
            timestamp: new Date().toISOString()
          }, 'error');
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    console.error('Error setting up forecast stream:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Unified Multi-Platform Forecasting API (Simplified)',
    description: 'AI-powered forecasting using DeepSeek agents - works with Polymarket and Kalshi',
    usage: 'POST with { marketUrl: string, drivers?: string[], historyInterval?: string }',
    parameters: {
      marketUrl: 'Required. Full market URL (Polymarket or Kalshi). Platform is auto-detected.',
      polymarketSlug: 'Deprecated. Use marketUrl instead.',
      drivers: 'Optional. Key factors to focus analysis on. Auto-generated if not provided.',
      historyInterval: 'Optional. Price history granularity ("1h", "4h", "1d", "1w").',
    },
    supportedPlatforms: {
      polymarket: {
        name: 'Polymarket',
        urlFormat: 'https://polymarket.com/event/{slug}',
        example: 'https://polymarket.com/event/will-trump-win-2024'
      },
      kalshi: {
        name: 'Kalshi',
        urlFormat: 'https://kalshi.com/markets/{series}/{category}/{ticker}',
        example: 'https://kalshi.com/markets/kxtime/times-person-of-the-year/KXTIME-25'
      }
    }
  });
}
