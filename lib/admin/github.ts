/**
 * Single-commit-per-action wrapper around GitHub's Git Data API.
 *
 * Vercel rebuilds on each push to main, so each admin action becomes one
 * atomic commit (e.g. "Add photo: lion-08") with all related file changes
 * (binary asset + metadata JSON updates).
 *
 * Concurrency: we read the latest ref SHA before building the tree. If the
 * push 409s because main moved, retry once.
 */
import "server-only";
import { Octokit } from "octokit";

export interface FileChange {
  path: string;
  /** UTF-8 string for text files; Buffer for binaries. `null` deletes the file. */
  content: string | Buffer | null;
}

export interface CommitOptions {
  message: string;
  files: FileChange[];
  /** Commit author (default: site bot). */
  author?: { name: string; email: string };
}

export interface RepoConfig {
  owner: string;
  repo: string;
  branch: string;
}

function repoConfig(): RepoConfig {
  const token = process.env.GITHUB_TOKEN;
  const repoFull = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? "main";
  if (!token) throw new Error("GITHUB_TOKEN missing");
  if (!repoFull) throw new Error("GITHUB_REPO missing (expected owner/name)");
  const [owner, repo] = repoFull.split("/");
  if (!owner || !repo) throw new Error(`GITHUB_REPO malformed: ${repoFull}`);
  return { owner, repo, branch };
}

function octokit(): Octokit {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

export async function commitFiles(opts: CommitOptions): Promise<{ sha: string; url: string }> {
  return commitFilesWithRetry(opts, 1);
}

async function commitFilesWithRetry(
  opts: CommitOptions,
  retriesLeft: number,
): Promise<{ sha: string; url: string }> {
  const { owner, repo, branch } = repoConfig();
  const kit = octokit();

  // 1. Latest ref + commit + tree
  const { data: ref } = await kit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const headSha = ref.object.sha;
  const { data: headCommit } = await kit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: headSha,
  });
  const baseTreeSha = headCommit.tree.sha;

  // 2. Create blobs for every non-delete file change.
  const treeItems = await Promise.all(
    opts.files.map(async (f) => {
      if (f.content === null) {
        return { path: f.path, mode: "100644" as const, type: "blob" as const, sha: null };
      }
      const isBinary = Buffer.isBuffer(f.content);
      const { data: blob } = await kit.rest.git.createBlob({
        owner,
        repo,
        content: isBinary ? (f.content as Buffer).toString("base64") : (f.content as string),
        encoding: isBinary ? "base64" : "utf-8",
      });
      return {
        path: f.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    }),
  );

  // 3. New tree off the current head's tree.
  const { data: tree } = await kit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  // 4. Commit.
  const { data: commit } = await kit.rest.git.createCommit({
    owner,
    repo,
    message: opts.message,
    tree: tree.sha,
    parents: [headSha],
    author: opts.author,
  });

  // 5. Fast-forward the ref. If main moved, retry once with fresh state.
  try {
    await kit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commit.sha,
    });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 409 || status === 422) {
      if (retriesLeft > 0) {
        return commitFilesWithRetry(opts, retriesLeft - 1);
      }
    }
    throw err;
  }

  return {
    sha: commit.sha,
    url: `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
  };
}

/**
 * Read the current contents of a file from the configured branch.
 * Used by writers that need to mutate JSON arrays based on the latest state.
 */
export async function readFile(path: string): Promise<{ content: string; sha: string } | null> {
  const { owner, repo, branch } = repoConfig();
  const kit = octokit();
  try {
    const { data } = await kit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });
    if (Array.isArray(data) || data.type !== "file" || !("content" in data)) return null;
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return { content, sha: data.sha };
  } catch (err: unknown) {
    if ((err as { status?: number })?.status === 404) return null;
    throw err;
  }
}
