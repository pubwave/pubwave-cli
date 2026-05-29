import React from "react";
import { Box, Text } from "ink";

export interface KeyValueItem {
  label: string;
  value?: unknown;
}

export function KeyValueList(props: { items: KeyValueItem[] }): React.ReactElement {
  return (
    <Box flexDirection="column">
      {props.items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.value != null)
        .map(({ item, index }) => (
          <Box key={`${item.label}-${index}`}>
            <Box width={18}>
              <Text color="gray">{item.label}</Text>
            </Box>
            <Text>{String(item.value)}</Text>
          </Box>
        ))}
    </Box>
  );
}
