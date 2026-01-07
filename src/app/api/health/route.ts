import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

/**
 * GET /api/health
 * 
 * Health check endpoint for monitoring and observability
 */
export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Test database connection
    const { data, error } = await supabase
      .from('documents')
      .select('count', { count: 'exact' })
      .limit(1);

    if (error) {
      logger.error({ error }, 'Health check: Database connection failed');
      return NextResponse.json(
        {
          status: 'unhealthy',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    logger.info('Health check passed');
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error({ error: errorObj }, 'Health check failed');
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: process.env.NODE_ENV === 'development' ? errorObj.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
