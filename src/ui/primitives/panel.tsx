import React from "react";
import { Box, Text } from "ink";

export function Panel(props: { title: string; children: React.ReactNode; color?: string }): React.ReactElement {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={props.color ?? "cyan"} paddingX={1} paddingY={0}>
      <Text bold color={props.color ?? "cyan"}>{props.title}</Text>
      <Box marginTop={1} flexDirection="column">
        {props.children}
      </Box>
    </Box>
  );
}
