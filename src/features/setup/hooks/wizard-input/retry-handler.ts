import { classifyMobileRetryGuide } from "../../mobile/error-analysis.js";
import { mobileProjectDir, openMacAppStoreXcode, openXcodeWorkspace } from "../../mobile/actions.js";
import type { WizardInputContext, WizardInputKey } from "./context.js";

export function handleMobileRetryInput(ctx: WizardInputContext, key: WizardInputKey): void {
  if (key.leftArrow) {
    void ctx.saveAndExit({ mobileInstall: "skip" });
    return;
  }

  if (!key.return) {
    return;
  }

  const guide = classifyMobileRetryGuide(ctx.mobileResult, ctx.locale);
  if (guide === "ios-signing" && !ctx.mobileRetryOpened) {
    openXcodeWorkspace(mobileProjectDir(ctx.context));
    ctx.setMobileRetryOpened(true);
    return;
  }
  if (guide === "ios-xcode-missing" && !ctx.mobileRetryOpened) {
    openMacAppStoreXcode();
    ctx.setMobileRetryOpened(true);
    return;
  }

  ctx.setMobileRetryOpened(false);
  void ctx.retryMobileInstall();
}
