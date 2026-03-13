import React from "react";
import { Box, Text } from "ink";
import { useTheme } from "../context/ThemeContext";

interface Props {
  mode: string;
  activeTab: "sessions" | "team";
  staleCount: number;
  sessionCount: number;
  confirmStale?: boolean;
  cols: number;
}

export function StatusLine({
  mode,
  activeTab,
  staleCount,
  sessionCount,
  confirmStale,
  cols,
}: Props) {
  const theme = useTheme();

  let content: React.ReactNode;

  if (confirmStale) {
    content = (
      <Text>
        <Text color={theme.yellow}>
          End {staleCount} stale session{staleCount > 1 ? "s" : ""}?{" "}
        </Text>
        <Text color={theme.accent} bold>[y]</Text>
        <Text color={theme.subtext0}> yes  </Text>
        <Text color={theme.accent} bold>[n]</Text>
        <Text color={theme.subtext0}> no</Text>
      </Text>
    );
  } else if (mode === "new-session") {
    content = (
      <Text color={theme.overlay1}>Enter to confirm · Esc to cancel</Text>
    );
  } else if (activeTab === "team") {
    content = (
      <Text color={theme.overlay1}>Viewing team sessions · <Text color={theme.accent}>t</Text> to switch back</Text>
    );
  } else if (staleCount > 0) {
    content = (
      <Text>
        <Text color={theme.yellow}>⚠ {staleCount} stale session{staleCount > 1 ? "s" : ""}</Text>
        <Text color={theme.overlay1}> · </Text>
        <Text color={theme.accent}>c</Text>
        <Text color={theme.overlay1}> to clean</Text>
      </Text>
    );
  } else {
    content = (
      <Text color={theme.overlay1}>
        {sessionCount > 0
          ? `↑↓ navigate · ↵ select · tab switch focus · ←→ buttons`
          : `n new session · s setup · q quit`}
      </Text>
    );
  }

  return (
    <Box width={cols} flexDirection="column">
      <Text color={theme.surface2}>{"─".repeat(Math.max(1, cols - 2))}</Text>
      <Box paddingX={1}>{content}</Box>
    </Box>
  );
}
