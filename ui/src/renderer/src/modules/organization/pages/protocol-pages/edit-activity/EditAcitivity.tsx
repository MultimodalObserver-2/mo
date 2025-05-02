import styles from "./edit-activity.module.css"
import Button from "@renderer/core/components/button/Button"
import Checkbox from "@renderer/core/components/checkbox/Checkbox"
import DocumentSearchIcon from "@renderer/core/components/icons/DocumentSearchIcon"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import Input from "@renderer/core/components/input/Input"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalFooter from "@renderer/core/components/page-modal/modal-footer/ModalFooter"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import { ActivityCreate } from "@renderer/modules/organization/types/Protocol"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"

export default function EditActivity() {
  const [searchParams] = useSearchParams()
  const [activity, setActivity] = useState<ActivityCreate | null>(null)
  const [hasTimeLimit, setHasTimeLimit] = useState(true)
  const [filePath, setFilePath] = useState("")

  useEffect(() => {
    const activityData = {
      name: searchParams.get("name") || "",
      path: searchParams.get("path") || "",
      has_time_limit: searchParams.get("has_time_limit") === "true",
      time_limit: parseInt(searchParams.get("time_limit") || "0", 10),
      start_message: searchParams.get("start_message") || "",
      end_message: searchParams.get("end_message") || "",
      close_activity: searchParams.get("close_activity") === "true",
      show_timer: searchParams.get("show_timer") === "true"
    }
    setActivity(activityData)
    setFilePath(activityData.path)
    setHasTimeLimit(activityData.has_time_limit)
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target
    const activityData = {
      name: form.name.value,
      path: filePath,
      has_time_limit: hasTimeLimit,
      time_limit: form.timeLimit.value || 0,
      start_message: form.startMessage.value,
      end_message: form.endMessage.value,
      close_activity: form.closeActivity.checked,
      show_timer: form.showTimer.checked
    }
    window.organization.updateActivity(activity?.name, activityData)
    window.close()
  }

  const closeModalWindow = () => {
    window.close()
  }

  const handleSearchLocation = async () => {
    const result = await window.core.dialog.showOpenDialog({
      title: "Search for a file",
      defaultPath: filePath,
      properties: ["openFile"]
    })
    if (result.canceled) {
      return
    }
    const selectedPath = result.filePaths[0]
    setFilePath(selectedPath)
  }

  return (
    <PageModal>
      <ModalHeader>
        <ModalTitle title="Edit Activity" Icon={EditIcon} />
      </ModalHeader>
      <ModalBody type="form" id="update" onSubmit={handleSubmit}>
        <Input
          label="Name"
          id="name"
          required
          placeholder="Enter the activity name"
          type="text"
          defaultValue={activity?.name}
        />
        <div className={styles["location-label"]}>
          <label htmlFor="path">Path</label>
          <div className={styles["location-input"]}>
            <Input
              id="path"
              placeholder="Enter the path to the file to be opened or search for it"
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
            />
            <Button
              type="button"
              className={styles["location-button"]}
              styleType="soft"
              onClick={handleSearchLocation}
            >
              <DocumentSearchIcon className={styles["button-icon"]} />
            </Button>
          </div>
        </div>
        <Input
          label="Start Message"
          id="startMessage"
          placeholder="Enter the start message for the activity"
          type="text"
          defaultValue={activity?.start_message}
        />
        <Input
          label="End Message"
          id="endMessage"
          placeholder="Enter the end message for the activity"
          type="text"
          defaultValue={activity?.end_message}
        />
        <div className={styles["time-limit-box"]}>
          <span>Time limit (seconds)</span>
          <div className={styles["time-limit-inputs"]}>
            <Checkbox
              id="hasTimeLimit"
              checked={hasTimeLimit}
              onChange={() => setHasTimeLimit(!hasTimeLimit)}
            >
              Has time limit?
            </Checkbox>
            <Input
              id="timeLimit"
              placeholder="Enter the time limit for the activity in seconds"
              type="number"
              disabled={!hasTimeLimit}
              defaultValue={activity?.time_limit}
              min={0}
              step={1}
            />
          </div>
        </div>
        <div className={styles["additional-options"]}>
          <span>Additional options</span>
          <Checkbox id="closeActivity" defaultChecked={activity?.close_activity}>
            Close when the activity has finished
          </Checkbox>
          <Checkbox id="showTimer" defaultChecked={activity?.show_timer}>
            Display a timer during the activity
          </Checkbox>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button type="submit" form="update">
          UPDATE ACTIVITY
        </Button>
        <Button styleType="danger" onClick={closeModalWindow}>
          CLOSE
        </Button>
      </ModalFooter>
    </PageModal>
  )
}
