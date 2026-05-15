import { useCallback, useEffect, useState } from "react";
import { availableOllamaModelChoicesAsync } from "../../models/ollama/availability.js";
import type { ModelChoice } from "../../models/types.js";
import type { CliCommandContext } from "../../../core/types.js";

export interface LocalModelChoicesResult {
  choices: ModelChoice[];
  refresh: () => void;
}

export function useLocalModelChoices(context: CliCommandContext, modelSource: "cloud" | "local"): LocalModelChoicesResult {
  const [localModelChoices, setLocalModelChoices] = useState<ModelChoice[]>(() => context.features.localModel.choices);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (modelSource !== "local" || context.features.localModel.runtime !== "ollama") {
      return;
    }

    let active = true;
    void availableOllamaModelChoicesAsync(context.features.localModel.choices).then((choices) => {
      if (active) {
        setLocalModelChoices(choices);
      }
    });

    return () => {
      active = false;
    };
  }, [context.features.localModel.choices, context.features.localModel.runtime, modelSource, refreshTick]);

  const refresh = useCallback(() => {
    setRefreshTick((tick) => tick + 1);
  }, []);

  return { choices: localModelChoices, refresh };
}
