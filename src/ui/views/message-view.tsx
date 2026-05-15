import React from "react";
import { Text } from "ink";
import { Panel } from "../primitives/panel.js";

export function MessageView(props: { title: string; message: string; color?: string }): React.ReactElement {
  return (
    <Panel title={props.title} color={props.color}>
      <Text>{props.message}</Text>
    </Panel>
  );
}
