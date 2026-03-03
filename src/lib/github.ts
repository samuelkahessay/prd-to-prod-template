const REPO = 'samuelkahessay/prd-to-prod-template'
const API = 'https://api.github.com'

interface Stats {
  prsMerged: number
  deploys: number
  selfHeals: number
}

export async function getStats(): Promise<Stats> {
  try {
    const headers: HeadersInit = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'prd-to-prod-landing',
    }

    const prsRes = await fetch(`${API}/repos/${REPO}/pulls?state=closed&per_page=100`, {
      headers,
      next: { revalidate: 3600 },
    })
    const prs = prsRes.ok ? await prsRes.json() : []
    const prsMerged = Array.isArray(prs) ? prs.filter((pr: { merged_at: string | null }) => pr.merged_at).length : 0

    const runsRes = await fetch(`${API}/repos/${REPO}/actions/runs?per_page=100`, {
      headers,
      next: { revalidate: 3600 },
    })
    const runsData = runsRes.ok ? await runsRes.json() : { workflow_runs: [] }
    const runs = runsData.workflow_runs || []

    const deploys = runs.filter(
      (r: { name: string; conclusion: string }) =>
        r.name === 'Deploy to Vercel' && r.conclusion === 'success'
    ).length

    const selfHeals = runs.filter(
      (r: { name: string; conclusion: string }) =>
        r.name === 'Auto-Dispatch Pipeline Issues' && r.conclusion === 'success'
    ).length

    return { prsMerged, deploys, selfHeals }
  } catch {
    return { prsMerged: 0, deploys: 0, selfHeals: 0 }
  }
}
