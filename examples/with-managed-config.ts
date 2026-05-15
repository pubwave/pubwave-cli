import {
  createPubwaveCli,
  managedJsonConfig,
  type PubwaveCliConfig
} from "../src/index.js";

interface ExampleAppConfig {
  app: {
    defaultLanguage: string;
    freshnessDays: number;
  };
  ai: {
    modelSource: "cloud" | "local";
    provider: string;
    model: string;
    apiKey: string;
  };
  sources: {
    techNews: { items: string[] };
    indieDev: { items: string[] };
  };
  mobile: {
    ios: { enabled: boolean };
    android: { enabled: boolean };
  };
}

const DEFAULTS: ExampleAppConfig = {
  app: { defaultLanguage: "en", freshnessDays: 3 },
  ai: { modelSource: "cloud", provider: "openai", model: "gpt-4o-mini", apiKey: "" },
  sources: {
    techNews: { items: ["https://example.com/feed.xml"] },
    indieDev: { items: ["https://example.com/indie.xml"] }
  },
  mobile: {
    ios: { enabled: false },
    android: { enabled: false }
  }
};

const cli = createPubwaveCli<ExampleAppConfig>({
  app: {
    name: "WithManagedConfig",
    command: "with-managed-config",
    version: "0.0.0"
  },
  config: managedJsonConfig<ExampleAppConfig>({
    scope: "user",
    defaults: DEFAULTS,
    toCliConfig: (config): PubwaveCliConfig => ({
      language: config.app.defaultLanguage,
      ai: {
        modelSource: config.ai.modelSource,
        provider: config.ai.provider,
        model: config.ai.model,
        apiKey: config.ai.apiKey
      },
      mobile: {
        enabled: config.mobile.ios.enabled || config.mobile.android.enabled
      }
    }),
    fromCliConfig: (cli) => ({
      app: cli.language ? { defaultLanguage: cli.language } : undefined as never,
      ai: cli.ai
        ? {
            modelSource: cli.ai.modelSource ?? "cloud",
            provider: cli.ai.provider ?? "openai",
            model: cli.ai.model ?? "",
            apiKey: cli.ai.apiKey ?? ""
          }
        : undefined as never,
      mobile: cli.mobile?.enabled !== undefined
        ? {
            ios: { enabled: cli.mobile.enabled },
            android: { enabled: cli.mobile.enabled }
          }
        : undefined as never
    }),
    validate: (config) => {
      if (typeof config.app.freshnessDays !== "number") {
        throw new Error("freshnessDays must be a number");
      }
    }
  }),
  features: {
    cloudModel: true,
    localModel: true,
    mobile: { flutter: false }
  }
});

await cli.run(process.argv.slice(2));
