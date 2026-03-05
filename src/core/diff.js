import { simpleGit } from 'simple-git';
import { extname, basename } from 'path';

export async function getDiff({ staged = false, base = 'main', filesGlob } = {}) {
  const git = simpleGit();

  try {
    await git.revparse(['--git-dir']);
  } catch {
    throw new Error('Not a git repository. Run reviewbot inside a git project.');
  }

  let diff = '';

  if (staged) {
    diff = await git.diff(['--staged', '--unified=5']);
  } else {
    try {
      await git.revparse([base]);
      diff = await git.diff([`${base}...HEAD`, '--unified=5']);
    } catch {
      // base branch doesn't exist — fall back to local changes
    }

    if (!diff) {
      const unstaged = await git.diff(['--unified=5']);
      const stagedDiff = await git.diff(['--staged', '--unified=5']);
      diff = [unstaged, stagedDiff].filter(Boolean).join('\n');
    }
  }

  if (!diff) return '';
  if (filesGlob) diff = filterDiffByGlob(diff, filesGlob);

  return truncateDiff(diff, 12000);
}

function filterDiffByGlob(diff, glob) {
  const chunks = diff.split(/^diff --git /m).filter(Boolean);
  const filtered = chunks.filter((chunk) => {
    const match = chunk.match(/^a\/(.+?) b\//);
    if (!match) return true;
    return matchGlob(match[1], glob);
  });
  return filtered.map((c) => 'diff --git ' + c).join('');
}

/**
 * Simple glob matcher — handles *.ext, **\/*, and plain strings.
 * No external dependency needed for basic use cases.
 */
function matchGlob(filePath, glob) {
  // Convert glob to regex
  const pattern = glob
    .replace(/\./g, '\\.')        // escape dots
    .replace(/\*\*\//g, '(.+/)?') // **/ matches any path prefix
    .replace(/\*/g, '[^/]*');     // * matches within a segment
  const re = new RegExp(`^${pattern}$`);
  return re.test(filePath);
}

function truncateDiff(diff, maxLines) {
  const lines = diff.split('\n');
  if (lines.length <= maxLines) return diff;
  return (
    lines.slice(0, maxLines).join('\n') +
    `\n\n... diff truncated at ${maxLines} lines (${lines.length} total) ...`
  );
}
