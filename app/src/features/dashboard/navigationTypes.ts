export type RootStackParamList = {
  ConsolidatedDashboard: undefined;
  PortfolioDetail: { portfolioId: string };
  PortfolioOperations: { portfolioId: string; mode?: 'create' | 'activity' };
};
