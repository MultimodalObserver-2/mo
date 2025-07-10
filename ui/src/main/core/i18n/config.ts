import preferencesManager from "../preferences/PreferencesManager";

export const i18nConfig = {
  lng: preferencesManager.get<string>("language") ?? "en",
  fallbackLng: "en",
  ns: ["core", "organization", "capture", "visualization"],
  fallbackNS: "core"
}
