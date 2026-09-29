export interface ApiErrorBody {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}
