import { useTranslation } from "react-i18next"

export default function Title() {
  const { t } = useTranslation("capture", { keyPrefix: "components.captureConfigProvider" })
  return t("title")
}
