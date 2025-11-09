import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Standard error response format
 */
export interface ApiError {
  error: string
  details?: any
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: any
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  )
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: ZodError): NextResponse<ApiError> {
  const errors = error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message,
  }))

  return createErrorResponse(
    'Validation failed',
    400,
    { validationErrors: errors }
  )
}

/**
 * Handle unknown errors
 */
export function handleUnknownError(error: unknown): NextResponse<ApiError> {
  console.error('Unknown error:', error)
  
  const message = error instanceof Error 
    ? error.message 
    : 'An unexpected error occurred'

  return createErrorResponse(
    message,
    500
  )
}

