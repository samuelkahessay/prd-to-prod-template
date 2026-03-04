import { GitPullRequest, Rocket, Zap } from "lucide-react";

const GITHUB_OWNER = "skahessay";
const GITHUB_REPO = "prd-to-prod-template";

interface GitHubStats {
  prsMerged: number;
  deploys: number;
  selfHeals: number;
}

async function fetchStats(): Promise<GitHubStats | null> {
  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
    };

    // Fetch merged PRs with pipeline label
    const prsRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${GITHUB_OWNER}/${GITHUB_REPO}+type:pr+is:merged+label:pipeline&per_page=1`,
      { headers, next: { revalidate: 3600 } }
    );

    // Fetch self-heal issues (ci-failure label)
    const healsRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${GITHUB_OWNER}/${GITHUB_REPO}+type:issue+label:ci-failure&per_page=1`,
      { headers, next: { revalidate: 3600 } }
    );

    if (!prsRes.ok || !healsRes.ok) return null;

    const prsData = await prsRes.json();
    const healsData = await healsRes.json();

    const prsMerged = prsData.total_count ?? 0;
    const selfHeals = healsData.total_count ?? 0;

    // Only show section if there's meaningful data
    const total = prsMerged + selfHeals;
    if (total === 0) return null;

    return {
      prsMerged,
      deploys: prsMerged, // each merged PR triggers a deploy
      selfHeals,
    };
  } catch {
    return null;
  }
}

export async function StatsSection() {
  const stats = await fetchStats();
  if (!stats) return null;

  const items = [
    {
      icon: GitPullRequest,
      value: stats.prsMerged,
      label: "PRs merged",
    },
    {
      icon: Rocket,
      value: stats.deploys,
      label: "Deployments",
    },
    {
      icon: Zap,
      value: stats.selfHeals,
      label: "Self-heals",
    },
  ];

  return (
    <section className="border-t bg-muted/30 py-12">
      <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4 px-4 sm:px-6">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1.5 text-center">
            <item.icon className="size-5 text-muted-foreground" />
            <span className="text-2xl font-bold tabular-nums sm:text-3xl">
              {item.value}
            </span>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
