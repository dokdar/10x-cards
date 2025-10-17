/**
 * Base error class for OpenRouter service
 */
export class OpenRouterError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "OpenRouterError";
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }
}

/**
 * Configuration error - thrown when environment variables are missing or invalid
 */
export class ConfigurationError extends OpenRouterError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ConfigurationError";
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * API error - thrown when OpenRouter API returns an error status (4xx or 5xx)
 */
export class ApiError extends OpenRouterError {
  public readonly statusCode: number;
  public readonly apiMessage: string;
  public readonly apiType?: string;
  public readonly apiCode?: string;

  constructor(statusCode: number, apiMessage: string, apiType?: string, apiCode?: string, options?: ErrorOptions) {
    super(`API Error (${statusCode}): ${apiMessage}${apiType ? ` [${apiType}]` : ""}`, options);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.apiMessage = apiMessage;
    this.apiType = apiType;
    this.apiCode = apiCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Network error - thrown when there are network connectivity issues
 */
export class NetworkError extends OpenRouterError {
  constructor(message: string, options?: ErrorOptions) {
    super(`Network Error: ${message}`, options);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Parsing error - thrown when response is not valid JSON
 */
export class ParsingError extends OpenRouterError {
  public readonly rawContent?: string;

  constructor(message: string, rawContent?: string, options?: ErrorOptions) {
    super(`Parsing Error: ${message}`, options);
    this.name = "ParsingError";
    this.rawContent = rawContent;
    Object.setPrototypeOf(this, ParsingError.prototype);
  }
}

/**
 * Validation error - thrown when response JSON doesn't match expected schema
 */
export class ValidationError extends OpenRouterError {
  public readonly validationErrors: unknown;

  constructor(message: string, validationErrors: unknown, options?: ErrorOptions) {
    super(`Validation Error: ${message}`, options);
    this.name = "ValidationError";
    this.validationErrors = validationErrors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
