export interface PortfolioOverview {
  owner: {
    name: string;
    domain: string;
    mission: string;
  };
  infrastructure: {
    cluster: {
      distribution: string;
      location: string;
      gitOpsTooling: string[];
    };
    controlPlane: string[];
  };
  gitopsVision: {
    description: string;
    roadmap: string[];
  };
}
