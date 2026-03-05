export async function getPRDiff(prUrl, config = {}) {
  const { owner, repo, number } = parsePRUrl(prUrl);
  const token = config.githubToken || process.env.GITHUB_TOKEN;

  const headers = { Accept: 'application/vnd.github.v3.diff', 'User-Agent': 'reviewbot-cli' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`, { headers });

  if (response.status === 401) throw new Error('GitHub 401 — set GITHUB_TOKEN env var for private repos.');
  if (response.status === 404) throw new Error(`PR not found: ${owner}/${repo}#${number}`);
  if (!response.ok) throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);

  return response.text();
}

function parsePRUrl(input) {
  const url = input.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (url) return { owner: url[1], repo: url[2], number: url[3] };

  const short = input.match(/^([^/]+)\/([^#]+)#(\d+)$/);
  if (short) return { owner: short[1], repo: short[2], number: short[3] };

  throw new Error(`Cannot parse PR reference: "${input}"\nExpected: https://github.com/owner/repo/pull/123  or  owner/repo#123`);
}
