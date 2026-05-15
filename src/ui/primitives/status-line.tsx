import React from "react";
import { Box, Text } from "ink";

export function StatusLine(props: { ok?: boolean; label: string; detail?: string }): React.ReactElement {
  const color = props.ok === undefined ? "cyan" : props.ok ? "green" : "red";
  const marker = props.ok === undefined ? "•" : props.ok ? "✓" : "✗";
  return (
    <Box>
      <Box width={2}>
        <Text color={color}>{marker}</Text>
      </Box>
      <Box width={24}>
        <Text color={color}>{props.label}</Text>
      </Box>
      {props.detail ? <Text>{props.detail}</Text> : null}
    </Box>
  );
}
