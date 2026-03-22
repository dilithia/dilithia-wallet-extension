export class ProviderError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
  }
}

export function asProviderError(error) {
  if (error instanceof ProviderError) {
    return error;
  }
  if (error instanceof Error) {
    return new ProviderError("INTERNAL_ERROR", error.message);
  }
  return new ProviderError("INTERNAL_ERROR", String(error));
}
