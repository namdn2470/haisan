export function apiResponse<T>(
  data: T,
  message?: string,
): { success: boolean; message: string; data: T } {
  return {
    success: true,
    message: message || 'Thành công',
    data,
  };
}

export function apiError(
  message: string,
  _status?: number,
): { success: false; message: string } {
  return {
    success: false,
    message,
  };
}
