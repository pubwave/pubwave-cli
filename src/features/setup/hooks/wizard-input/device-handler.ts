import type { WizardInputContext, WizardInputKey } from "./context.js";

export function handleMobileDeviceInput(
  ctx: WizardInputContext,
  value: string,
  key: WizardInputKey
): void {
  if (!ctx.mobileDeviceChoiceState) {
    return;
  }
  if (key.upArrow) {
    ctx.setMobileDeviceCursorIndex((previous) => previous <= 0 ? ctx.mobileDeviceChoiceState!.devices.length - 1 : previous - 1);
    return;
  }
  if (key.downArrow) {
    ctx.setMobileDeviceCursorIndex((previous) => previous >= ctx.mobileDeviceChoiceState!.devices.length - 1 ? 0 : previous + 1);
    return;
  }
  if (value === " ") {
    const device = ctx.mobileDeviceChoiceState.devices[ctx.mobileDeviceCursorIndex];
    if (!device) {
      return;
    }
    ctx.setMobileDeviceChoiceState((previous) => previous
      ? {
          ...previous,
          selectedDeviceIds: previous.selectedDeviceIds.includes(device.id)
            ? previous.selectedDeviceIds.filter((deviceId) => deviceId !== device.id)
            : [...previous.selectedDeviceIds, device.id]
        }
      : previous);
    return;
  }
  if (key.return && ctx.mobileDeviceChoiceState.selectedDeviceIds.length > 0) {
    const selectedDeviceIds = ctx.mobileDeviceChoiceState.selectedDeviceIds;
    ctx.setMobileDeviceChoiceState(null);
    ctx.setPhase("mobileInstalling");
    ctx.mobileDeviceSelectionResolver.current?.(selectedDeviceIds);
    ctx.mobileDeviceSelectionResolver.current = null;
  }
}
