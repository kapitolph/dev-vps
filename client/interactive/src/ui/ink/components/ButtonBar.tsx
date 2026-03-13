import React from "react";
import { Box, Text } from "ink";
import { useTheme } from "../context/ThemeContext";

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
    <Box paddingX={1} gap={1} flexWrap="wrap" dimColor={!isFocusZone}>
      {buttons.map((btn, i) => {
        const isFocused = i === focusedIndex;
        const isActive = isFocused && isFocusZone;

        return (
          <Box key={btn.key}>
            <Text
              backgroundColor={isActive ? theme.buttonFocusBg : isFocused ? undefined : theme.buttonBg}
              color={isActive ? theme.base : theme.subtext0}
              bold={isActive}
            >
              {" "}
              <Text
                color={isActive ? theme.base : theme.dimmed}
                bold={false}
              >
                {btn.key}
              </Text>
              {" "}{btn.label}{" "}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
