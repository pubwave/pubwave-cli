import { useInput } from "ink";
import type { WizardInputContext } from "./wizard-input/context.js";
import { handleMobileDeviceInput } from "./wizard-input/device-handler.js";
import { handleMobileRetryInput } from "./wizard-input/retry-handler.js";
import { handleSetupInput } from "./wizard-input/setup-handler.js";

export function useWizardInput(ctx: WizardInputContext): void {
  useInput((value, key) => {
    if (ctx.phase === "mobileDeviceChoice") {
      handleMobileDeviceInput(ctx, value, key);
      return;
    }

    if (ctx.phase === "mobileRetry") {
      handleMobileRetryInput(ctx, key);
      return;
    }

    if (ctx.phase === "done") {
      // Setup finished: stay on the completion screen. Only Ctrl+C exits, so a
      // stray Enter can't tear down the screen (and its ready info) by accident.
      return;
    }

    if (ctx.phase !== "setup") {
      return;
    }

    handleSetupInput(ctx, value, key);
  });
}
