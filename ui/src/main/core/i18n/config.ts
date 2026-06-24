import preferencesManager from "../preferences/PreferencesManager"

export const getI18nConfig = () => {
  return {
    lng: preferencesManager.get<string>("language") ?? "en",
    fallbackLng: "en",
    ns: ["core", "organization", "capture", "visualization", "communication", "client"],
    fallbackNS: "core"
  }
}
