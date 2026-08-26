export interface ApiResponse<T> {
  isSuccess: boolean;
  timestamp: string;
  code: string;
  httpStatus: number;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  isSuccess: false;
  timestamp: string;
  code: string;
  httpStatus: number;
  message: string;
  data: null;
}
