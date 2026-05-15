import React from "react";
import { render } from "ink";
import { MessageView } from "./views/message-view.js";

export async function renderInk(element: React.ReactElement): Promise<void> {
  const app = render(element);
  await app.waitUntilExit();
}

export function isReactElement(value: unknown): value is React.ReactElement {
  return React.isValidElement(value);
}

export function unknownResultView(title: string, value: unknown): React.ReactElement {
  return (
    <MessageView
      title={title}
      message={typeof value === "string" ? value : JSON.stringify(value, null, 2)}
    />
  );
}
