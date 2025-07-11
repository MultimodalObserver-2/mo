import styles from "./edit-activity.module.css"
import Button from "@renderer/core/components/button/Button"
import Checkbox from "@renderer/core/components/checkbox/Checkbox"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import Input from "@renderer/core/components/input/Input"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalFooter from "@renderer/core/components/page-modal/modal-footer/ModalFooter"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import PathInput from "@renderer/core/components/path-input/PathInput"
import { ActivityCreate } from "@renderer/modules/organization/types/Protocol"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"

export default function EditActivity() {
  const { t } = useTranslation("organization", { keyPrefix: "pages.editActivity" })
  const [searchParams] = useSearchParams()
  const [activity, setActivity] = useState<ActivityCreate | null>(null)
  const [hasTimeLimit, setHasTimeLimit] = useState(true)
  const [closeActivity, setCloseActivity] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [filePath, setFilePath] = useState("")

  useEffect(() => {
    const activityData = {
      name: searchParams.get("name") ?? "",
      path: searchParams.get("path") ?? "",
      has_time_limit: searchParams.get("has_time_limit") === "true",
      time_limit: parseInt(searchParams.get("time_limit") ?? "0", 10),
      start_message: searchParams.get("start_message") ?? "",
      end_message: searchParams.get("end_message") ?? "",
      close_activity: searchParams.get("close_activity") === "true",
      process_name: searchParams.get("process_name") ?? "",
      show_timer: searchParams.get("show_timer") === "true"
    }
    setActivity(activityData)
    setFilePath(activityData.path)
    setHasTimeLimit(activityData.has_time_limit)
    setCloseActivity(activityData.close_activity)
    setShowTimer(activityData.show_timer)
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target
    const activityData = {
      name: form.name.value,
      path: filePath,
      has_time_limit: hasTimeLimit,
      time_limit: form.timeLimit.value ?? 0,
      start_message: form.startMessage.value,
      end_message: form.endMessage.value,
      close_activity: form.closeActivity.checked,
      process_name: form.processName.value,
      show_timer: form.showTimer.checked
    }
    window.organization.updateActivity(activity?.name, activityData)
    window.close()
  }

  const closeModalWindow = () => {
    window.close()
  }

  return (
    <PageModal>
      <ModalHeader>
        <ModalTitle title={t("title")} Icon={EditIcon} />
      </ModalHeader>
      <ModalBody type="form" id="update" onSubmit={handleSubmit}>
        <Input
          label={t("name_label")}
          id="name"
          required
          placeholder={t("name_placeholder")}
          type="text"
          defaultValue={activity?.name}
        />
        <PathInput
          label={t("path_label")}
          id="path"
          required={closeActivity}
          placeholder={t("path_placeholder")}
          value={filePath}
          onChange={(e) => {
            setFilePath(e.target.value)
          }}
        />
        <Input
          label={t("start_message_label")}
          id="startMessage"
          placeholder={t("start_message_placeholder")}
          type="text"
          defaultValue={activity?.start_message}
        />
        <Input
          label={t("end_message_label")}
          id="endMessage"
          placeholder={t("end_message_placeholder")}
          type="text"
          defaultValue={activity?.end_message}
        />
        <div className={styles["time-limit-box"]}>
          <span>{t("time_limit_box_label")}</span>
          <div className={styles["time-limit-inputs"]}>
            <Checkbox
              id="hasTimeLimit"
              checked={hasTimeLimit}
              onChange={() => setHasTimeLimit(!hasTimeLimit)}
            >
              {t("has_time_limit")}
            </Checkbox>
            <Input
              id="timeLimit"
              placeholder={`${t("time_limit_placeholder")}${hasTimeLimit ? " (*)" : ""}`}
              type="number"
              required={hasTimeLimit}
              disabled={!hasTimeLimit}
              defaultValue={activity?.time_limit}
              min={1}
              step={1}
            />
          </div>
        </div>
        <div className={styles["additional-options"]}>
          <span>{t("additional_options_label")}</span>
          <div className={styles["close-activity-box"]}>
            <span></span>
            <div className={styles["close-activity-inputs"]}>
              <Checkbox
                id="closeActivity"
                checked={closeActivity}
                onChange={() => setCloseActivity(!closeActivity)}
              >
                {t("close_when_finished")}
              </Checkbox>
              <Input
                id="processName"
                placeholder={`${t("process_name_placeholder")}${closeActivity ? " (*)" : ""}`}
                type="text"
                required={closeActivity}
                disabled={!closeActivity}
                defaultValue={activity?.process_name}
              />
            </div>
          </div>
          <Checkbox id="showTimer" checked={showTimer} onChange={() => setShowTimer(!showTimer)}>
            {t("display_timer")}
          </Checkbox>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button type="submit" form="update">
          {t("update_button").toUpperCase()}
        </Button>
        <Button styleType="danger" onClick={closeModalWindow}>
          {t("close_button").toUpperCase()}
        </Button>
      </ModalFooter>
    </PageModal>
  )
}
