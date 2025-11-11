import { NextResponse } from 'next/server';

export interface ApiError {
  error: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
}

export function formatErrorResponse(error: any, status: number = 500): NextResponse {
  const message = error instanceof Error ? error.message : 'An unknown error occurred';
  
  return NextResponse.json(
    { 
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: error?.stack })
    },
    { status }
  );
}

export function formatSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function formatValidationErrorResponse(errors: any): NextResponse {
  return NextResponse.json(
    { 
      error: 'Validation failed',
      details: errors 
    },
    { status: 400 }
  );
}