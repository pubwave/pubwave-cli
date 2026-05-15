import React from "react";
import { Box, Text } from "ink";
import { Panel } from "../primitives/panel.js";
import { KeyValueList, type KeyValueItem } from "../primitives/key-value-list.js";

export function ConfigView(props: {
  title: string;
  items: KeyValueItem[];
  note?: string;
}): React.ReactElement {
  return (
    <Panel title={props.title} color="green">
      <KeyValueList items={props.items} />
      {props.note ? (
        <Box marginTop={1}>
          <Text color="yellow">{props.note}</Text>
        </Box>
      ) : null}
    </Panel>
  );
}
