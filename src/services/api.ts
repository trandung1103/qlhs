import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
});

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  errors?: Record<string, string>;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    if (!body) return error.message;
    if (Array.isArray(body.message)) return body.message.join(', ');
    return body.message ?? 'Đã xảy ra lỗi';
  }
  return 'Đã xảy ra lỗi không xác định';
}
