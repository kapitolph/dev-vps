import { Box, Spacer, Text, useInput } from "ink";
import { useCallback, useEffect, useState } from "react";
import { fetchRepoCommits, relativeTime } from "../../../lib/sessions";
import type { CommitData, Machine, RepoData, SessionData } from "../../../types";
import { useTheme } from "../context/ThemeContext";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { icons, BRAND_BLUE } from "../theme";
import type { AppAction } from "../App";

interface Props {
  machine: Machine;
  repo: RepoData;
  sessions: SessionData[];
  onAction: (action: AppAction) => void;
  onBack: () => void;
  onNewSession: () => void;
}

export function RepoDetailPage({ machine, repo, sessions, onAction, onBack, onNewSession }: Props) {
  const theme = useTheme();
  const { cols, rows } = useTerminalSize();
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [cursor, setCursor] = useState(0);

  // Filter sessions for this repo
  const repoSessions = sessions.filter(s => s.pane_cwd && s.pane_cwd.startsWith(repo.path));
  const activeSessions = repoSessions
    .filter(s => parseInt(s.client_count || "0", 10) > 0)
    .sort((a, b) => parseInt(b.last_activity, 10) - parseInt(a.last_activity, 10));
  const inactiveSessions = repoSessions
    .filter(s => parseInt(s.client_count || "0", 10) === 0)
    .sort((a, b) => parseInt(b.last_activity, 10) - parseInt(a.last_activity, 10));
  const allSessions = [...activeSessions, ...inactiveSessions];

  useEffect(() => {
    fetchRepoCommits(machine, repo.path).then(setCommits);
  }, [machine.host, repo.path]);

  const clampCursor = useCallback((c: number) => Math.max(0, Math.min(c, allSessions.length - 1)), [allSessions.length]);

  useEffect(() => {
    setCursor(c => clampCursor(c));
  }, [clampCursor]);

  useInput((input, key) => {
    if (key.escape || input === "q") {
      onBack();
      return;
    }
    if (input === "n") {
      onNewSession();
      return;
    }
    if (input === "o") {
      onAction({ type: "cd-to-repo", repoPath: repo.path });
      return;
    }
    if ((key.downArrow || input === "j") && allSessions.length > 0) {
      setCursor(c => clampCursor(c + 1));
      return;
    }
    if ((key.upArrow || input === "k") && allSessions.length > 0) {
      setCursor(c => clampCursor(c - 1));
      return;
    }
    if (key.return && allSessions.length > 0 && cursor < allSessions.length) {
      const session = allSessions[cursor];
      onAction({ type: "resume", sessionName: session.name });
      return;
    }
  });

  const contentWidth = cols - 4;

  return (
    <Box flexDirection="column" width={cols} height={rows} backgroundColor={theme.screenBg}>
      {/* Header */}
      <Box paddingX={2} paddingY={1}>
        <Text bold color={theme.accent}>{repo.name}</Text>
        <Spacer />
        <Text color={theme.overlay1}>branch: </Text>
        <Text color={theme.green}>{repo.branch}</Text>
      </Box>

      {/* Divider */}
      <Box paddingX={2}>
        <Text color={theme.surface2}>{"─".repeat(contentWidth)}</Text>
      </Box>

      {/* Sessions */}
      <Box flexDirection="column" paddingX={2} paddingTop={1} flexGrow={1}>
        {activeSessions.length > 0 && (
          <>
            <Box paddingBottom={1}>
              <Text bold color={theme.accent}>Active Sessions ({activeSessions.length})</Text>
            </Box>
            {activeSessions.map((s, i) => {
              const idx = i;
              const isSelected = cursor === idx;
              const count = parseInt(s.client_count || "0", 10);
              const users = (s.attached_users || "").split(",").filter(Boolean);
              return (
                <Box key={s.name}>
                  <Text color={isSelected ? theme.cursor : undefined}>
                    {isSelected ? icons.cursor : " "}
                  </Text>
                  <Text> </Text>
                  <Text color={theme.sessionActive}>{icons.active}</Text>
                  <Text> </Text>
                  <Text bold={isSelected} color={isSelected ? theme.accent : theme.text}>{s.name}</Text>
                  <Text color={theme.overlay1}> {s.owner}</Text>
                  <Spacer />
                  <Text color={theme.overlay1}>{relativeTime(s.last_activity)}</Text>
                  {count > 0 && (
                    <>
                      <Text> {icons.attached} </Text>
                      {users.map((u, j) => (
                        <Text key={u} color={u === s.owner ? theme.green : theme.lavender}>
                          {j > 0 ? ", " : ""}{u}
                        </Text>
                      ))}
                    </>
                  )}
                </Box>
              );
            })}
          </>
        )}

        {inactiveSessions.length > 0 && (
          <Box flexDirection="column" paddingTop={activeSessions.length > 0 ? 1 : 0}>
            <Box paddingBottom={1}>
              <Text bold color={theme.overlay1}>Inactive Sessions ({inactiveSessions.length})</Text>
            </Box>
            {inactiveSessions.map((s, i) => {
              const idx = activeSessions.length + i;
              const isSelected = cursor === idx;
              return (
                <Box key={s.name}>
                  <Text color={isSelected ? theme.cursor : undefined}>
                    {isSelected ? icons.cursor : " "}
                  </Text>
                  <Text> </Text>
                  <Text color={theme.sessionIdle}>{icons.idle}</Text>
                  <Text> </Text>
                  <Text bold={isSelected} color={isSelected ? theme.accent : theme.text}>{s.name}</Text>
                  <Text color={theme.overlay1}> {s.owner}</Text>
                  <Spacer />
                  <Text color={theme.overlay1}>{relativeTime(s.last_activity)}</Text>
                </Box>
              );
            })}
          </Box>
        )}

        {allSessions.length === 0 && (
          <Text color={theme.overlay0}>No sessions in this repo</Text>
        )}

        {/* Commits */}
        {commits.length > 0 && (
          <Box flexDirection="column" paddingTop={1}>
            <Box paddingBottom={1}>
              <Text bold color={theme.overlay1}>Recent Commits</Text>
            </Box>
            {commits.slice(0, 10).map(c => (
              <Box key={c.hash}>
                <Text color={theme.yellow}>{c.hash}</Text>
                <Text>  </Text>
                <Text color={theme.overlay1}>{c.author}</Text>
                <Text>  </Text>
                <Text color={theme.overlay0}>{c.date}</Text>
                <Text>  </Text>
                <Text color={theme.text}>{c.subject.slice(0, Math.max(20, contentWidth - 40))}</Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box paddingX={1}>
        <Text color={theme.overlay0}>
          <Text color={BRAND_BLUE}>n</Text> new session{" "}
          <Text color={BRAND_BLUE}>o</Text> open shell{" "}
          <Text color={BRAND_BLUE}>{"↵"}</Text> join{" "}
          <Text color={BRAND_BLUE}>esc</Text> back
        </Text>
      </Box>
    </Box>
  );
}
