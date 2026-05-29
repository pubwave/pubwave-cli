import React from "react";
import { Box, Text } from "ink";
import { KeyValueList, Panel, type KeyValueItem } from "../../../../ui/index.js";

/**
 * Shared config summary used by both the saved view (pre-launch gate) and the
 * post-setup completion screen, so the two stay visually identical and the
 * config rows live in one place. Hosts feed extra rows through
 * `features.setup.configRows`, which both call sites resolve into `items`.
 */
export function SetupConfigSummary(props: {
  title: string;
  items: KeyValueItem[];
  hint?: string;
  color?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}): React.ReactElement {
  return (
    <Panel title={props.title} color={props.color ?? "green"}>
      {props.hint ? <Text color="yellow">{props.hint}</Text> : null}
      <Box marginTop={props.hint ? 1 : 0} flexDirection="column">
        <KeyValueList items={props.items} />
      </Box>
      {props.children ? (
        <Box marginTop={1} flexDirection="column">
          {props.children}
        </Box>
      ) : null}
      {props.footer ? (
        <Box marginTop={1} flexDirection="column">
          {props.footer}
        </Box>
      ) : null}
    </Panel>
  );
}
