import type { CliCommandContext, PubwaveCliConfig } from "../../../core/types.js";
import type { ModelChoice } from "../../models/types.js";
import {
  localizedCloudModelChoices,
  localizedCloudProviderChoices,
  localizedLanguageChoices,
  localizedLocalModelChoices,
  localizedMobileInstallChoices,
  localizedModelSourceChoices,
  wizardMessage,
  type WizardLocale
} from "../../../shared/i18n/wizard/index.js";
import type {
  CustomSetupStep,
  ErasedProjectConfig,
  SetupChoiceGroup,
  SetupState,
  SetupStep,
  SetupStepContext,
  SetupTextContext,
  StandardSetupStepId
} from "../types.js";

export function buildSteps(
  context: CliCommandContext<ErasedProjectConfig>,
  state: SetupState,
  locale: WizardLocale,
  localModelChoices: ModelChoice[],
  projectConfig: ErasedProjectConfig,
  cliConfig: PubwaveCliConfig
): SetupStep[] {
  const steps: SetupStep[] = [
    {
      id: "language",
      title: wizardMessage(locale, "languageTitle"),
      hint: wizardMessage(locale, "languageHint"),
      choices: localizedLanguageChoices(locale, context.features.setup.languages)
    }
  ];

  if (shouldRequireAiSetup(context, state, projectConfig, cliConfig)) {
    steps.push({
      id: "modelSource",
      title: wizardMessage(locale, "modelSourceTitle"),
      hint: wizardMessage(locale, "modelSourceHint"),
      choices: localizedModelSourceChoices(locale)
    });

    if (state.modelSource === "cloud") {
      steps.push({
        id: "provider",
        title: wizardMessage(locale, "providerTitle"),
        hint: wizardMessage(locale, "providerHint"),
        choices: localizedCloudProviderChoices(locale, context.features.cloudModel.providers)
      });
      steps.push({
        id: "model",
        title: wizardMessage(locale, "cloudModelTitle"),
        hint: wizardMessage(locale, "cloudModelHint"),
        kind: "choice",
        choices: localizedCloudModelChoices(locale, context.features.cloudModel.providers, state.provider),
        inputValueKey: "model",
        ...(state.cloudModelInputMode ? { description: wizardMessage(locale, "customCloudModelDescription") } : {})
      });
      steps.push({
        id: "apiKey",
        kind: "input",
        title: wizardMessage(locale, "apiKeyTitle"),
        hint: wizardMessage(locale, "apiKeyHint"),
        choices: [],
        inputMask: false,
        inputValueKey: "apiKey",
        description: wizardMessage(locale, "apiKeyDescription")
      });
    } else {
      steps.push({
        id: "model",
        title: wizardMessage(locale, "localModelTitle"),
        hint: wizardMessage(locale, "localModelHint"),
        choices: localizedLocalModelChoices(locale, localModelChoices),
        choiceGroups: buildLocalModelChoiceGroups(locale, localModelChoices)
      });
    }
  }

  if (context.features.mobile) {
    steps.push({
      id: "mobileInstall",
      title: wizardMessage(locale, "mobileInstallTitle"),
      hint: wizardMessage(locale, "mobileInstallHint"),
      choices: localizedMobileInstallChoices(locale)
    });
  }

  return insertCustomSteps(steps, context, state, locale, projectConfig, cliConfig);
}

export function shouldRequireAiSetup(
  context: CliCommandContext<ErasedProjectConfig>,
  state: SetupState,
  projectConfig: ErasedProjectConfig,
  cliConfig: PubwaveCliConfig
): boolean {
  return context.features.setup.shouldRequireAiSetup({
    state,
    projectConfig,
    cliConfig
  });
}

function insertCustomSteps(
  steps: SetupStep[],
  context: CliCommandContext<ErasedProjectConfig>,
  state: SetupState,
  locale: WizardLocale,
  projectConfig: ErasedProjectConfig,
  cliConfig: PubwaveCliConfig
): SetupStep[] {
  const customSteps = context.features.setup.customSteps as
    | CustomSetupStep<ErasedProjectConfig>[]
    | undefined;
  if (!customSteps || customSteps.length === 0) {
    return steps;
  }

  const textContext: SetupTextContext = { locale, app: context.app };
  const stepContext: SetupStepContext<ErasedProjectConfig> = {
    ...textContext,
    projectConfig,
    cliConfig
  };

  const result = [...steps];
  for (const customStep of customSteps) {
    const built = buildCustomStep(customStep, textContext, stepContext);
    const insertIndex = resolveInsertIndex(result, customStep);
    result.splice(insertIndex, 0, built);
  }
  return result;
}

function resolveInsertIndex(
  steps: SetupStep[],
  customStep: CustomSetupStep<ErasedProjectConfig>
): number {
  if (customStep.insertAfter) {
    const idx = findStandardStepIndex(steps, customStep.insertAfter);
    if (idx >= 0) return idx + 1;
  }
  if (customStep.insertBefore) {
    const idx = findStandardStepIndex(steps, customStep.insertBefore);
    if (idx >= 0) return idx;
  }
  return steps.length;
}

function findStandardStepIndex(steps: SetupStep[], id: StandardSetupStepId): number {
  return steps.findIndex((step) => step.id === id);
}

function buildCustomStep(
  customStep: CustomSetupStep<ErasedProjectConfig>,
  textContext: SetupTextContext,
  stepContext: SetupStepContext<ErasedProjectConfig>
): SetupStep {
  const title = typeof customStep.title === "function" ? customStep.title(textContext) : customStep.title;
  const hint = typeof customStep.hint === "function"
    ? customStep.hint(textContext)
    : customStep.hint ?? "";
  const description = typeof customStep.description === "function"
    ? customStep.description(textContext)
    : customStep.description;
  const choices = typeof customStep.choices === "function"
    ? customStep.choices(stepContext)
    : customStep.choices ?? [];

  return {
    id: customStep.id,
    title,
    hint,
    kind: customStep.kind,
    choices,
    inputMask: customStep.inputMask,
    description,
    isCustom: true
  };
}

function buildLocalModelChoiceGroups(locale: WizardLocale, choices: ModelChoice[]): SetupChoiceGroup[] {
  const localizedChoices = localizedLocalModelChoices(locale, choices);
  const installed = localizedChoices.filter((choice) => choice.group === "installed");
  const recommended = localizedChoices.filter((choice) => choice.group !== "installed" && choice.group !== "more");
  const more = localizedChoices.filter((choice) => choice.group === "more");

  return [
    ...(installed.length > 0 ? [{ id: "installed" as const, choices: installed }] : []),
    ...(recommended.length > 0 ? [{ id: "recommended" as const, choices: recommended }] : []),
    ...(more.length > 0 ? [{ id: "more" as const, choices: more }] : [])
  ];
}
