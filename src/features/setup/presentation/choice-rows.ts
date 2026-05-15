import { wizardMessage, type WizardLocale } from "../../../shared/i18n/wizard/index.js";
import type { SetupStep } from "../types.js";

export interface ChoiceRenderRow {
  key: string;
  kind: "gap" | "group" | "choice" | "state";
  text: string;
  color?: "green" | "gray" | "red" | "cyan";
  choiceValue?: string;
}

export function localModelGroupTitle(
  locale: WizardLocale,
  groupId: "installed" | "recommended" | "more"
): string {
  switch (groupId) {
    case "installed":
      return wizardMessage(locale, "installedModelsGroup");
    case "more":
      return wizardMessage(locale, "remoteModelsGroup");
    case "recommended":
    default:
      return wizardMessage(locale, "recommendedModelsGroup");
  }
}

export function buildChoiceRenderRows(
  currentStep: SetupStep,
  locale: WizardLocale,
  selectedChoiceValue: string | undefined
): ChoiceRenderRow[] {
  if (!currentStep.choiceGroups || currentStep.choiceGroups.length === 0) {
    return currentStep.choices.map((choice) => ({
      key: choice.value,
      kind: "choice",
      text: choice.value === selectedChoiceValue ? `› ${choice.label}` : `  ${choice.label}`,
      ...(choice.value === selectedChoiceValue ? { color: "green" as const } : {}),
      choiceValue: choice.value
    }));
  }

  return currentStep.choiceGroups.flatMap((group, groupIndex) => {
    const rows: ChoiceRenderRow[] = [];

    if (groupIndex > 0) {
      rows.push({
        key: `gap-${group.id}`,
        kind: "gap",
        text: ""
      });
    }

    rows.push({
      key: `group-${group.id}`,
      kind: "group",
      text: localModelGroupTitle(locale, group.id),
      color: "cyan"
    });

    return [
      ...rows,
      ...group.choices.map((choice) => ({
        key: choice.value,
        kind: "choice" as const,
        text: choice.value === selectedChoiceValue ? `› ${choice.label}` : `  ${choice.label}`,
        ...(choice.value === selectedChoiceValue ? { color: "green" as const } : {}),
        choiceValue: choice.value
      }))
    ];
  });
}
