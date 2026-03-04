export interface SubmitPrdParams {
  owner: string;
  repo: string;
  title: string;
  content: string;
}

export interface SubmitPrdResult {
  success: boolean;
  issueNumber?: number;
  issueUrl?: string;
  error?: string;
  failedStep?: 'commitFile' | 'createIssue' | 'triggerDecompose';
}

interface SubmitApiResponse {
  success: boolean;
  path?: string;
  issueNumber?: number;
  issueUrl?: string;
  error?: string;
  step?: 'commitFile' | 'createIssue' | 'triggerDecompose';
}

class SubmitStepError extends Error {
  failedStep: 'commitFile' | 'createIssue' | 'triggerDecompose';

  constructor(step: 'commitFile' | 'createIssue' | 'triggerDecompose', message: string) {
    super(message);
    this.name = 'SubmitStepError';
    this.failedStep = step;
  }
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

async function postSubmit(payload: Record<string, unknown>): Promise<SubmitApiResponse> {
  const response = await fetch('/api/prd/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => null)) as SubmitApiResponse | null;

  if (!result) {
    throw new Error('Invalid response from submission endpoint');
  }

  return result;
}

export async function commitPrdFile(
  owner: string,
  repo: string,
  title: string,
  content: string
): Promise<{ path: string }> {
  const result = await postSubmit({ owner, repo, title, content, step: 'commitFile' });

  if (!result.success) {
    throw new SubmitStepError('commitFile', result.error ?? 'Failed to commit PRD file');
  }

  return { path: result.path ?? `docs/prd/${slugify(title)}.md` };
}

export async function createPrdIssue(
  owner: string,
  repo: string,
  title: string,
  body: string
): Promise<{ number: number; url: string }> {
  const result = await postSubmit({
    owner,
    repo,
    title,
    content: body,
    step: 'createIssue',
  });

  if (!result.success || !result.issueNumber || !result.issueUrl) {
    throw new SubmitStepError('createIssue', result.error ?? 'Failed to create PRD issue');
  }

  return { number: result.issueNumber, url: result.issueUrl };
}

export async function triggerDecompose(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<void> {
  const result = await postSubmit({ owner, repo, issueNumber, step: 'triggerDecompose' });

  if (!result.success) {
    throw new SubmitStepError(
      'triggerDecompose',
      result.error ?? 'Failed to trigger /decompose'
    );
  }
}

export async function submitPrd(params: SubmitPrdParams): Promise<SubmitPrdResult> {
  try {
    await commitPrdFile(params.owner, params.repo, params.title, params.content);
    const issue = await createPrdIssue(
      params.owner,
      params.repo,
      params.title,
      params.content
    );
    await triggerDecompose(params.owner, params.repo, issue.number);

    return {
      success: true,
      issueNumber: issue.number,
      issueUrl: issue.url,
    };
  } catch (error) {
    if (error instanceof SubmitStepError) {
      return {
        success: false,
        error: error.message,
        failedStep: error.failedStep,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit PRD',
    };
  }
}
