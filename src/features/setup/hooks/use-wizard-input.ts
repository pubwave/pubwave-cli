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
      if (key.return) {
        ctx.exit();
      }
      return;
    }

    if (ctx.phase !== "setup") {
      return;
    }

    handleSetupInput(ctx, value, key);
  });
}
