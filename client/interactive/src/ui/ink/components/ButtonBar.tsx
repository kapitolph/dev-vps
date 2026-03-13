import React from "react";
import { Box, Text } from "ink";
import { useTheme } from "../context/ThemeContext";
import { toBold } from "../theme";

export interface ButtonDef {
  key: string;
  label: string;
  action: () => void;
}

interface Props {
  buttons: ButtonDef[];
  focusedIndex: number;
  isFocusZone: boolean;
}

export function ButtonBar({ buttons, focusedIndex, isFocusZone }: Props) {
  const theme = useTheme();

  return (
    <Box flexDirection="column" paddingX={1} gap={0}>
      {buttons.map((btn, i) => {
        const isFocused = i === focusedIndex && isFocusZone;

        return (
          <Box
            key={btn.key}
            borderStyle="round"
            borderColor={isFocused ? theme.accent : theme.surface1}
            paddingX={1}
          >
            <Text color={isFocused ? theme.accent : theme.overlay0}>{btn.key}</Text>
            <Text> </Text>
            <Text
              color={isFocused ? theme.accent : theme.subtext0}
              bold={isFocused}
            >
              {toBold(btn.label.toUpperCase())}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
