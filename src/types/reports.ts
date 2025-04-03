export interface UserContributionReport {
  user: {
    firstName: string;
    lastName: string;
  };
  summary: {
    totalAmount: number;
    count: number;
    categories: {
      [key: string]: {
        amount: number;
        count: number;
      };
    };
  };
  periodSummaries: Array<{
    period: string;
    amount: number;
    count: number;
  }>;
  contributions: Array<{
    date: string;
    category: string;
    amount: number;
  }>;
}
