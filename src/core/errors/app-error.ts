export class AppError extends Error {
  constructor(public message: string, public code?: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network connection failed or timed out. Please check your internet connection.') {
    super(message, 'NETWORK_ERROR');
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication failed. Please verify your API Key in Settings.') {
    super(message, 'AUTH_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded. Please wait a moment before trying again.') {
    super(message, 'RATE_LIMIT_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Local database operation failed.') {
    super(message, 'DATABASE_ERROR');
  }
}

export class ProviderError extends AppError {
  constructor(message: string, code = 'PROVIDER_ERROR') {
    super(message, code);
  }
}

export function parseError(error: any): AppError {
  if (error instanceof AppError) return error;

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    let errorMessage = '';
    if (typeof data === 'string') {
      if (data.trim().startsWith('<')) {
        errorMessage = `Server returned an HTML response (likely a 404 or bad gateway).`;
      } else {
        errorMessage = data;
      }
    } else {
      errorMessage = data?.error?.message || data?.message || JSON.stringify(data);
    }

    if (status === 401 || status === 403) {
      return new AuthError(`Authentication failed: ${errorMessage}`);
    }
    if (status === 429) {
      return new RateLimitError(`Rate limit reached: ${errorMessage}`);
    }
    return new ProviderError(errorMessage || 'API request failed', `HTTP_${status}`);
  }

  if (error.request || error.message?.includes('Network Error') || error.message?.includes('timeout')) {
    return new NetworkError();
  }

  return new AppError(error.message || 'An unknown error occurred.');
}
