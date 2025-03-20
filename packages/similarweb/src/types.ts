export type Website = {
    domain: string;
  }
  
  
  export interface WebsiteData {
    globalRank: number;
    categoryRank: number;
    monthlyVisits: number;
    lastWebUpdate: Date;
  }
  
  export interface SimilarWebResponse {
    Version: number;
    SiteName: string;
    Description: string;
    GlobalRank: {
      Rank: number;
    };
    CategoryRank: {
      Rank: string;
      Category: string;
    };
    Engagments: {
      BounceRate: string;
      Month: string;
      Year: string;
      PagePerVisit: string;
      Visits: string;
      TimeOnSite: string;
    };
    EstimatedMonthlyVisits: Record<string, number>;
    TopCountryShares: Array<{
      Country: number;
      CountryCode: string;
      Value: number;
    }>;
    TrafficSources: {
      Social: number;
      'Paid Referrals': number;
      Mail: number;
      Referrals: number;
      Search: number;
      Direct: number;
    };
    TopKeywords: Array<{
      Name: string;
      EstimatedValue: number;
      Volume: number;
      Cpc: number;
    }>;
    SnapshotDate: string;
  }