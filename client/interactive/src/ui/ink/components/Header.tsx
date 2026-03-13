import React from "react";
import { Box, Text, Spacer } from "ink";
import type { VersionInfo } from "../../../types";
import type { Layout } from "../hooks/useTerminalSize";
import { useTheme } from "../context/ThemeContext";
import { Logo } from "./Logo";

interface Props {
  machineName: string;
  npdevUser: string;
  version: VersionInfo;
  cols: number;
  layout: Layout;
}

export function Header({ machineName, npdevUser, version, cols, layout }: Props) {
  const theme = useTheme();

  return (
    <Box width={cols} backgroundColor={theme.surface0} paddingX={1}>
      <Box gap={1}>
        <Logo />
        <Text bold color={theme.text}>npdev</Text>
      </Box>
      <Spacer />
      <Box gap={1}>
        {layout !== "narrow" && (
          <>
            <Text color={theme.subtext0}>{machineName}</Text>
            <Text color={theme.overlay0}>·</Text>
          </>
        )}
        <Text color={theme.subtext0}>{npdevUser}</Text>
        {layout !== "narrow" && (
          <>
            <Text color={theme.overlay0}>·</Text>
            <Text color={theme.overlay1}>v{version.current}</Text>
          </>
        )}
        {version.latest && (
          <Text backgroundColor={theme.yellow} color={theme.base} bold>
            {" ↑ "}
          </Text>
        )}
        <Text backgroundColor={theme.contextBadge.color} color={theme.base} bold>
          {" "}{theme.contextBadge.label}{" "}
        </Text>
      </Box>
    </Box>
  );
}
