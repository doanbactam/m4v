import axios from "axios";
import type { WebsiteData, SimilarWebResponse } from "./types";
import { getDomain, prepareWebsiteData } from "./utils";

export const createSimilarWebClient = (apiKey: string) => {
  const client = axios.create({
    method: 'GET',
    baseURL: 'https://similarweb-traffic.p.rapidapi.com',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'similarweb-traffic.p.rapidapi.com'
    }
  });

  return {
    async queryWebsite(website: string): Promise<WebsiteData | null> {
      const domain = getDomain(website);
      console.log('🚀 Starting fetch for domain:', domain);

      try {
        console.log('📝 Request options:', {
          url: '/traffic',
          params: { domain },
          headers: client.defaults.headers
        });

        const { data, status } = await client.get('/traffic', {
          params: { domain }
        });

        console.log('✅ Response status:', status);
        console.log('📦 Raw response data:', data);

        if (!data) {
          console.warn('⚠️ No data received from API');
          return null;
        }

        const response = data as SimilarWebResponse;
        const processedData = prepareWebsiteData(response);
        console.log('🔄 Processed website data:', processedData);
        
        return processedData;

      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('❌ API Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
          });
        } else {
          console.error('❌ Unknown error:', error);
        }
        return null;
      }
    }
  };
};