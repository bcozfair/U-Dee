import { config } from "@tamagui/config/v3";
import { createTamagui } from "tamagui";

const appConfig = createTamagui({
  ...config,
  settings: {
    ...config.settings,
    allowedStyleValues: "somewhat-strict",
    autocompleteSpecificTokens: "except-special",
    fastSheet: true,
  },
});

export type AppConfig = typeof appConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig;
