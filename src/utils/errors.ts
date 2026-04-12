export class CreateMyrnAppError extends Error {
  readonly suggestion?: string

  constructor(
    message: string,
    options: {
      cause?: unknown
      suggestion?: string
    } = {},
  ) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = 'CreateMyrnAppError'
    this.suggestion = options.suggestion
  }
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof CreateMyrnAppError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'An unexpected error occurred.'
}
