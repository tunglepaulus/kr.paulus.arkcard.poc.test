// --- MODELS ---

export interface SinUpPayload {
  name: string;
  email: string;
  password: string;
  companies: {
    id: number | null;
    companyName: string;
    jobTitle: string;
    isCurrentCompany: boolean | null;
  }[];
}

export interface VerifyEmailPayload {
  email: string;
  verificationCode: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Custom error class to carry API error codes
export class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

// Helper to call server-side API routes
async function apiCall<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new ApiError(result.message || 'An unexpected error occurred', result.code || 'UNKNOWN');
  }

  return result;
}

export const authService = {
  verifyEmail: async (email: string) => {
    const result = await apiCall<{ success: boolean; valid: boolean; message: string }>(
      '/api/auth/check-email',
      { email }
    );
    return { valid: result.valid, message: result.message };
  },

  signup: async (payload: SinUpPayload) => {
    const result = await apiCall<{ success: boolean; data: any }>('/api/auth/signup', {
      email: payload.email,
      password: payload.password,
      name: payload.name,
      companies: payload.companies,
    });
    return result.data;
  },

  verifyOtp: async (payload: VerifyEmailPayload) => {
    const result = await apiCall<{ success: boolean; data: any }>('/api/auth/verify-otp', {
      email: payload.email,
      verificationCode: payload.verificationCode,
    });
    return result.data;
  },

  resendOtp: async (email: string) => {
    const result = await apiCall<{ success: boolean; data: any }>('/api/auth/resend-otp', {
      email,
    });
    return result.data;
  },

  login: async (payload: LoginPayload) => {
    const result = await apiCall<{ success: boolean; data: any }>('/api/auth/login', {
      email: payload.email,
      password: payload.password,
    });
    return result.data;
  },

  loginWithMagicLink: async (email: string) => {
    const result = await apiCall<{ success: boolean; message: string }>(
      '/api/auth/login-magic-link',
      { email }
    );
    return result;
  },
};
