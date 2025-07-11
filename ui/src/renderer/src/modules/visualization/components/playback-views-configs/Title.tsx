import { useTranslation } from "react-i18next"

export default function Title() {
  const { t } = useTranslation("visualization", { keyPrefix: "components.playbackViewsConfigs" })
  return t("title")
}
