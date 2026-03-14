import { Box, Text } from "ink";
import { useTheme } from "../context/ThemeContext";

export interface ButtonDef {
  key: string;
  label: string;
  action: () => void;
  highlight?: boolean;
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
          const color = isFocused ? theme.accent : btn.highlight ? theme.yellow : theme.overlay0;
          const labelColor = isFocused ? theme.accent : btn.highlight ? theme.yellow : theme.subtext0;
          const borderColor = isFocused ? theme.accent : btn.highlight ? theme.yellow : theme.surface1;

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
      <Text color={theme.overlay0}>{focusedDesc || " "}</Text>
    </Box>
  );
}
