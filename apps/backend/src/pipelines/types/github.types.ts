export interface GitHubWorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'neutral' | 'timed_out' | 'action_required' | null;
  event: string;
  created_at: string;
  updated_at: string;
  run_started_at: string | null;
  html_url: string;
}

export interface GitHubWorkflowRunsResponse {
  total_count: number;
  workflow_runs: GitHubWorkflowRun[];
}

export interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: 'active' | 'deleted' | 'disabled_fork' | 'disabled_inactivity' | 'disabled_manually';
}

export interface GitHubWorkflowsResponse {
  total_count: number;
  workflows: GitHubWorkflow[];
}

// Transformed types for API response
export interface WorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  headSha: string;
  headBranch: string;
  event: string;
  createdAt: string;
  updatedAt: string;
  runDurationSeconds: number | null;
  htmlUrl: string;
}

export interface WorkflowsEnvelope {
  configured: boolean;
  repoUrl: string | null;
  workflows: string[];
  runs: WorkflowRun[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
  };
}

export interface GitHubCommitResponse {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name?: string; email?: string; date?: string } | null;
    committer: { name?: string; email?: string; date?: string } | null;
  };
  author: { login?: string; avatar_url?: string } | null;
}

export interface CommitInfo {
  sha: string;
  message: string;
  authorName: string;
  authorLogin: string | null;
  authorAvatarUrl: string | null;
  authoredAt: string;
  htmlUrl: string;
}

