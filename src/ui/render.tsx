import React from "react";
import { render } from "ink";
import { FullscreenRoot } from "./primitives/fullscreen-root.js";
import { MessageView } from "./views/message-view.js";

const ENTER_ALT_SCREEN = "\x1b[?1049h\x1b[H";
const LEAVE_ALT_SCREEN = "\x1b[?1049l";

export async function renderInk(
  element: React.ReactElement,
  options?: { fullscreen?: boolean }
): Promise<void> {
  if (!options?.fullscreen || !process.stdout.isTTY) {
    const app = render(element);
    await app.waitUntilExit();
    return;
  }

  // Render into the alternate screen buffer so the fixed-height UI owns the
  // whole viewport and never pollutes (or smears across) the scrollback when
  // the terminal is resized. Restore the normal buffer no matter how we exit.
  let restored = false;
  const restore = (): void => {
    if (restored) {
      return;
    }
    restored = true;
    process.stdout.write(LEAVE_ALT_SCREEN);
  };

  process.stdout.write(ENTER_ALT_SCREEN);
  process.once("exit", restore);
  try {
    const app = render(<FullscreenRoot>{element}</FullscreenRoot>);
    await app.waitUntilExit();
  } finally {
    process.removeListener("exit", restore);
    restore();
  }
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
