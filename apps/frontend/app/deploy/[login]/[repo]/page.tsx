import { StatusClient } from './page.client';

export default function DeployStatusPage({
  params,
}: {
  params: { login: string; repo: string };
}): JSX.Element {
  return <StatusClient login={params.login} repo={params.repo} />;
}
