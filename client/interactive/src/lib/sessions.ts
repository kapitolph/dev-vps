import type { CommitData, Machine, RepoData, SessionData } from "../types";
import { sshExec } from "./ssh";

export async function fetchSessions(machine: Machine): Promise<SessionData[]> {
  const { stdout, exitCode } = await sshExec(machine, "bash ~/.vps/session.sh session-data");
  if (exitCode !== 0 || !stdout) return [];
  try {
    return JSON.parse(stdout);
  } catch {
    return [];
  }
}

export async function fetchRepos(machine: Machine): Promise<RepoData[]> {
  const { stdout, exitCode } = await sshExec(machine, "bash ~/.vps/session.sh repo-list");
  if (exitCode !== 0 || !stdout) return [];
  try { return JSON.parse(stdout); } catch { return []; }
}

export async function fetchRepoCommits(machine: Machine, repoPath: string): Promise<CommitData[]> {
  const { stdout, exitCode } = await sshExec(machine, `bash ~/.vps/session.sh repo-commits '${repoPath}' 15`);
  if (exitCode !== 0 || !stdout) return [];
  try { return JSON.parse(stdout); } catch { return []; }
}

export function deriveRepoName(session: SessionData, repos: RepoData[]): string | undefined {
  if (!session.pane_cwd) return undefined;
  const match = repos
    .filter(r => session.pane_cwd!.startsWith(r.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.name;
}

export function relativeTime(epoch: string): string {
  if (!epoch) return "unknown";
  const seconds = Math.floor(Date.now() / 1000) - parseInt(epoch, 10);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function activityAge(epoch: string): number {
  if (!epoch) return Infinity;
  return Math.floor(Date.now() / 1000) - parseInt(epoch, 10);
}

export const STALE_BUSINESS_DAYS = 3;

export function businessDaysElapsed(epoch: string): number {
  if (!epoch) return Infinity;
  const lastActive = new Date(parseInt(epoch, 10) * 1000);
  const now = new Date();
  const start = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let count = 0;
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}
