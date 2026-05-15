import React from "react";
import { Box, Text } from "ink";
import { Panel } from "../primitives/panel.js";

export function HelpView(props: {
  appName: string;
  commands: Array<{ name: string; description: string; commandText: string }>;
}): React.ReactElement {
  return (
    <Panel title={props.appName}>
      <Box flexDirection="column">
        {props.commands.map((command) => (
          <Box key={command.name}>
            <Box width={38}>
              <Text color="cyan">{command.commandText}</Text>
            </Box>
            <Text>{command.description}</Text>
          </Box>
        ))}
      </Box>
    </Panel>
  );
}
