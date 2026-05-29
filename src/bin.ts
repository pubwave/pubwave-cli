#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createPubwaveCli, jsonConfig } from "./index.js";

const cli = createPubwaveCli({
  app: {
    name: "Pubwave CLI",
    command: "pubwave",
    version: readPackageVersion()
  },
  config: jsonConfig({ scope: "user" }),
  features: {
    setup: true,
    cloudModel: true,
    localModel: true
  }
});

await cli.run(process.argv.slice(2));

function readPackageVersion(): string {
  try {
    const packageJson = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8")
    ) as { version?: unknown };
    return typeof packageJson.version === "string" ? packageJson.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}
