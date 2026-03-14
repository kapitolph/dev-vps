import { Box, Text } from "ink";
import { useTheme } from "../context/ThemeContext";

export interface ButtonDef {
  key: string;
  label: string;
  action: () => void;
  highlight?: boolean;
  active?: boolean;
  description?: string;
}

interface Props {
  buttons: ButtonDef[];
  focusedIndex: number;
  isFocusZone: boolean;
}

export function ButtonBar({ buttons, focusedIndex, isFocusZone }: Props) {
  const theme = useTheme();
  const focusedDesc = isFocusZone ? buttons[focusedIndex]?.description : undefined;

  return (
    <Box flexDirection="column" gap={0}>
      <Box gap={1} flexWrap="wrap">
        {buttons.map((btn, i) => {
          const isFocused = i === focusedIndex && isFocusZone;
          const tint = btn.active ? theme.green : btn.highlight ? theme.yellow : undefined;
          const color = isFocused ? theme.accent : tint || theme.overlay0;
          const labelColor = isFocused ? theme.accent : tint || theme.subtext0;
          const borderColor = isFocused ? theme.accent : tint || theme.surface1;

          return (
            <Box
              key={btn.key}
              borderStyle="round"
              borderColor={borderColor}
              paddingX={1}
            >
              <Text color={color}>{btn.key}</Text>
              <Text color={labelColor}> {btn.label}</Text>
            </Box>
          );
        })}
      </Box>
      <Box paddingTop={1}>
        <Text color={theme.overlay0}>{focusedDesc || " "}</Text>
      </Box>
    </Box>
  );
}
