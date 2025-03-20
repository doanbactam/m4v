/**
 * Định dạng thời gian từ giây thành chuỗi có thể đọc được
 * @param seconds Thời gian tính bằng giây
 * @returns Chuỗi định dạng "mm:ss"
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
} 