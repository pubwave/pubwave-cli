import React from "react";
import { Box, Text } from "ink";

export interface KeyValueItem {
  label: string;
  value?: unknown;
}

export function KeyValueList(props: { items: KeyValueItem[] }): React.ReactElement {
  return (
    <Box flexDirection="column">
      {props.items.filter((item) => item.value !== undefined).map((item) => (
        <Box key={item.label}>
          <Box width={18}>
            <Text color="gray">{item.label}</Text>
          </Box>
          <Text>{String(item.value)}</Text>
        </Box>
      ))}
    </Box>
  );
}
