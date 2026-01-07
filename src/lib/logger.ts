// Simple logger for Next.js - avoids thread-stream issues in dev
const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

export const logger = {
  info: (data: any, msg?: string) => {
    if (isDevelopment) {
      console.log(`[INFO] ${msg || ''}`, data);
    }
  },
  error: (data: any, msg?: string) => {
    console.error(`[ERROR] ${msg || ''}`, data);
  },
  debug: (data: any, msg?: string) => {
    if (isDevelopment && (logLevel === 'debug')) {
      console.log(`[DEBUG] ${msg || ''}`, data);
    }
  },
};

export function logApiCall(method: string, endpoint: string, duration: number) {
  logger.info(
    {
      type: 'api_call',
      method,
      endpoint,
      duration_ms: duration,
    },
    `API: ${method} ${endpoint}`
  );
}

export function logError(error: Error, context: string) {
  logger.error(
    {
      type: 'error',
      context,
      message: error.message,
      stack: error.stack,
    },
    `Error in ${context}`
  );
}

export function logRagOperation(operation: string, data: Record<string, any>) {
  logger.info(
    {
      type: 'rag_operation',
      operation,
      ...data,
    },
    `RAG: ${operation}`
  );
}
