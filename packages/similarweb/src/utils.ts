import { differenceInMonths } from "date-fns";
import type { SimilarWebResponse, WebsiteData } from "./types";

export const websiteDomainRegex = /^(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,})(?:\/.*)?$/;

/**
 * Extracts the domain from a website URL.
 *
 * @param url The website URL from which to extract the domain.
 * @returns The domain.
 */
export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export function formatNumber(num: number | bigint): string {
  const value = typeof num === 'bigint' ? Number(num) : num;
  
  if (value >= 1000000000) { // >= 1 tỷ
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) { // >= 1 triệu
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) { // >= 1 nghìn
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

export function formatPercentage(value: number): string {
  // Chuyển đổi từ decimal (0.xxxx) sang phần trăm và giữ 2 chữ số thập phân
  return `${(value * 100).toFixed(2)}%`;
}

export function formatPercentageChange(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export const prepareWebsiteData = (
  response: SimilarWebResponse
): WebsiteData => {
  const visits = response.Engagments?.Visits || '0';
  // Loại bỏ dấu phẩy và chuyển đổi thành số
  const cleanVisits = visits.replace(/,/g, '');
  
  return {
    globalRank: response.GlobalRank?.Rank || 0,
    categoryRank: Number(response.CategoryRank?.Rank) || 0,
    monthlyVisits: parseInt(cleanVisits, 10),
    lastWebUpdate: response.SnapshotDate ? new Date(response.SnapshotDate) : new Date()
  };
};