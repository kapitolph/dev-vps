import { Box, Text } from "ink";
import type React from "react";
import { useTheme } from "../context/ThemeContext";

interface Props {
  mode: string;
  activePanel: "mine" | "team";
  staleCount: number;
  sessionCount: number;
  confirmEndName?: string;
  confirmBulkNames?: string[];
  selectionCount?: number;
  cols: number;
}

export function StatusLine({
  mode,
  activePanel,
  staleCount,
  sessionCount,
  confirmEndName,
  confirmBulkNames,
  selectionCount = 0,
  cols,
}: Props) {
  const theme = useTheme();

  let content: React.ReactNode;

  if (confirmBulkNames && confirmBulkNames.length > 0) {
    const nameList = confirmBulkNames.join(", ");
    const shortEnough = nameList.length < cols - 30;
    const label = shortEnough
      ? `End ${confirmBulkNames.length} session${confirmBulkNames.length > 1 ? "s" : ""} (${nameList})?`
      : `End ${confirmBulkNames.length} session${confirmBulkNames.length > 1 ? "s" : ""}?`;
    content = (
      <Text>
        <Text color={theme.yellow}>{label} </Text>
        <Text color={theme.accent} bold>
          [y]
        </Text>
        <Text color={theme.subtext0}> yes </Text>
        <Text color={theme.accent} bold>
          [n]
        </Text>
        <Text color={theme.subtext0}> no</Text>
      </Text>
    );
  } else if (confirmEndName) {
    content = (
      <Text>
        <Text color={theme.yellow}>End '{confirmEndName}'? </Text>
        <Text color={theme.accent} bold>
          [y]
        </Text>
        <Text color={theme.subtext0}> yes </Text>
        <Text color={theme.accent} bold>
          [n]
        </Text>
        <Text color={theme.subtext0}> no</Text>
      </Text>
    );
  } else if (mode === "new-session") {
    content = <Text color={theme.overlay1}>Enter to confirm · Esc to cancel</Text>;
  } else if (activePanel === "team") {
    content = (
      <Text color={theme.overlay1}>
        Viewing team sessions · <Text color={theme.accent}>t</Text> to switch back
      </Text>
    );
  } else if (selectionCount > 0) {
    content = (
      <Text>
        <Text color={theme.yellow}>
          {selectionCount} selected
        </Text>
        <Text color={theme.overlay1}> · </Text>
        <Text color={theme.accent}>d</Text>
        <Text color={theme.overlay1}> delete · </Text>
        <Text color={theme.accent}>esc</Text>
        <Text color={theme.overlay1}> clear</Text>
      </Text>
    );
  } else if (staleCount > 0) {
    content = (
      <Text>
        <Text color={theme.yellow}>
          ⚠ {staleCount} stale session{staleCount > 1 ? "s" : ""}
        </Text>
        <Text color={theme.overlay1}> · </Text>
        <Text color={theme.accent}>c</Text>
        <Text color={theme.overlay1}> to clean</Text>
      </Text>
    );
  } else {
    content = (
      <Text color={theme.overlay1}>
        {sessionCount > 0 ? `↑↓ navigate · ←→ panels · ↵ select · d end` : `n new session · q quit`}
      </Text>
    );
  }

  return (
    <Box width={cols} paddingX={1}>
      {content}
    </Box>
  );
}
