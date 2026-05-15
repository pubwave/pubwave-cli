import {
  createPubwaveCli,
  jsonConfig,
  type CustomSetupStep,
  type PubwaveCliConfig
} from "../src/index.js";

const FRESHNESS_CHOICES = [
  { label: "1 day", value: "1" },
  { label: "3 days", value: "3" },
  { label: "5 days", value: "5" },
  { label: "7 days", value: "7" }
];

const freshnessStep: CustomSetupStep<PubwaveCliConfig> = {
  id: "freshnessDays",
  insertAfter: "model",
  kind: "choice",
  title: ({ locale }) => locale.startsWith("zh") ? "新鲜度（天）" : "Freshness (days)",
  hint: ({ locale }) => locale.startsWith("zh") ? "选择保留天数" : "Pick how many days of items to keep",
  choices: FRESHNESS_CHOICES,
  read(projectConfig) {
    const current = projectConfig.freshnessDays;
    return typeof current === "number" ? String(current) : "3";
  },
  async write(projectConfig, value) {
    const parsed = Number.parseInt(value, 10);
    return {
      projectConfig: {
        ...projectConfig,
        freshnessDays: Number.isFinite(parsed) ? parsed : projectConfig.freshnessDays
      }
    };
  }
};

const cli = createPubwaveCli({
  app: {
    name: "WithCustomStep",
    command: "with-custom-step",
    version: "0.0.0"
  },
  config: jsonConfig({ scope: "user" }),
  features: {
    setup: {
      customSteps: [freshnessStep]
    },
    cloudModel: true,
    localModel: true
  }
});

await cli.run(process.argv.slice(2));
