import styles from "./add-activity.module.css"
import Button from "@renderer/core/components/button/Button"
import Checkbox from "@renderer/core/components/checkbox/Checkbox"
import AddTaskIcon from "@renderer/core/components/icons/AddTaskIcon"
import Input from "@renderer/core/components/input/Input"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalFooter from "@renderer/core/components/page-modal/modal-footer/ModalFooter"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import PathInput from "@renderer/core/components/path-input/PathInput"
import { useState } from "react"

export default function AddActivity() {
  const [hasTimeLimit, setHasTimeLimit] = useState(true)
  const [closeActivity, setCloseActivity] = useState(false)
  const [filePath, setFilePath] = useState("")

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
      process_name: form.processName.value,
      show_timer: form.showTimer.checked
    }
    window.organization.addActivity(activityData)
    setFilePath("")
    setHasTimeLimit(true)
    form.reset()
  }

  const closeModalWindow = () => {
    window.close()
  }

  return (
    <PageModal>
      <ModalHeader>
        <ModalTitle title="Add Activity" Icon={AddTaskIcon} />
      </ModalHeader>
      <ModalBody type="form" id="create" onSubmit={handleSubmit}>
        <Input label="Name" id="name" required placeholder="Enter the activity name" type="text" />
        <PathInput
          label="Path"
          id="path"
          required={closeActivity}
          placeholder="Enter the path to the file to be opened or search for it"
          value={filePath}
          onChange={(e) => {
            setFilePath(e.target.value)
          }}
        />
        <Input
          label="Start Message"
          id="startMessage"
          placeholder="Enter the start message for the activity"
          type="text"
        />
        <Input
          label="End Message"
          id="endMessage"
          placeholder="Enter the end message for the activity"
          type="text"
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
              placeholder={`Enter the time limit for the activity in seconds ${hasTimeLimit ? "(*)" : ""}`}
              type="number"
              required={hasTimeLimit}
              disabled={!hasTimeLimit}
              min={1}
              step={1}
            />
          </div>
        </div>
        <div className={styles["additional-options"]}>
          <span>Additional options</span>
          <div className={styles["close-activity-box"]}>
            <span></span>
            <div className={styles["close-activity-inputs"]}>
              <Checkbox
                id="closeActivity"
                checked={closeActivity}
                onChange={() => setCloseActivity((prev) => !prev)}
              >
                Close when activity has finished
              </Checkbox>
              <Input
                id="processName"
                placeholder={`Enter the process name to be closed ${closeActivity ? "(*)" : ""}`}
                type="text"
                required={closeActivity}
                disabled={!closeActivity}
              />
            </div>
          </div>
          <Checkbox id="showTimer">Display a timer during the activity</Checkbox>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button type="submit" form="create">
          ADD ACTIVITY
        </Button>
        <Button styleType="danger" onClick={closeModalWindow}>
          CLOSE
        </Button>
      </ModalFooter>
    </PageModal>
  )
}
