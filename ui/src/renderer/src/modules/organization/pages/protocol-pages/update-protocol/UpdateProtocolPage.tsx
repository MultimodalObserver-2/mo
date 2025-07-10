import styles from "./update-protocol.module.css"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import Button from "@renderer/core/components/button/Button"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import Input from "@renderer/core/components/input/Input"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalFooter from "@renderer/core/components/page-modal/modal-footer/ModalFooter"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import ElementActions from "@renderer/core/components/panel/panel-element/element-header/ElementActions"
import ElementHeader from "@renderer/core/components/panel/panel-element/element-header/ElementHeader"
import ElementTitle from "@renderer/core/components/panel/panel-element/element-header/ElementTitle"
import ElementList from "@renderer/core/components/panel/panel-element/element-list/ElementList"
import ElementListItem from "@renderer/core/components/panel/panel-element/element-list/ElementListItem"
import PanelElement from "@renderer/core/components/panel/panel-element/PanelElement"
import { useParams } from "react-router"
import { useEffect, useState } from "react"
import { showSelectProjectErrorMessage } from "@renderer/modules/organization/utils/dialogMessages"
import protocolService from "@renderer/modules/organization/services/ProtocolService"
import { ActivityCreate, Protocol } from "@renderer/modules/organization/types/Protocol"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import {
  openAddActivityModal,
  openEditActivityModal
} from "@renderer/modules/organization/utils/modalWindows"
import { addActivity, updateActivity } from "../protocolUtils"

export default function UpdateProtocolPage() {
  const { projectName, protocolName } = useParams<{ projectName: string; protocolName: string }>()
  const [activities, setActivities] = useState<ActivityCreate[]>([])
  const [protocol, setProtocol] = useState<Protocol | null>(null)

  useEffect(() => {
    const handleWinAddActivity = (activity: ActivityCreate) => {
      addActivity(activity, activities, setActivities)
    }

    const handleWinUpdateActivity = (originalName: string, activity: ActivityCreate) => {
      updateActivity(activities, setActivities, originalName, activity)
    }

    window.organization.onAddActivity(handleWinAddActivity)
    window.organization.onUpdateActivity(handleWinUpdateActivity)
    return () => {
      window.organization.removeAddActivity()
      window.organization.removeUpdateActivity()
    }
  }, [activities])

  useEffect(() => {
    if (!projectName || !protocolName) {
      showSelectProjectErrorMessage()
      window.close()
      return
    }

    const fetchProtocol = async () => {
      try {
        const response = await protocolService.get(projectName, protocolName)
        setProtocol(response.data)
        setActivities(response.data.activities)
      } catch (error) {
        showApiErrorMessage(error)
        window.close()
      }
    }

    fetchProtocol()
  }, [projectName, protocolName])

  const updateProtocol = async (e) => {
    if (!projectName || !protocolName) {
      showSelectProjectErrorMessage()
      window.close()
      return
    }

    e.preventDefault()
    const protocol = {
      name: e.target.name.value,
      activities: activities
    }

    if (activities.length === 0) {
      showApiErrorMessage(Error("You must add at least one activity to the protocol."))
      return
    }

    try {
      const response = await protocolService.update(projectName, protocolName, protocol)
      window.organization.reloadProtocols()
      if (protocolName !== protocol.name) {
        window.organization.changeSelectedProtocol(response.data)
      }
      window.close()
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  const handleAddActivity = () => {
    openAddActivityModal()
  }

  const handleEdit = (activity: ActivityCreate) => {
    openEditActivityModal(activity)
  }

  const deleteActivity = (index: number) => {
    setActivities((prevActivities) => prevActivities.filter((_, i) => i !== index))
  }

  return (
    <PageModal>
      <ModalHeader>
        <ModalTitle title="Update Protocol" Icon={EditIcon} />
      </ModalHeader>
      {protocol && (
        <>
          <ModalBody type="form" id="create" onSubmit={updateProtocol}>
            <Input
              label="Name"
              id="name"
              required
              placeholder="Enter the protocol name"
              type="text"
              defaultValue={protocol?.name}
            />
            <PanelElement className={styles["activities-panel"]}>
              <ElementHeader>
                <ElementTitle className={styles["activities-title"]}>Activities</ElementTitle>
                <ElementActions>
                  <button
                    type="button"
                    className={styles["add-button"]}
                    onClick={handleAddActivity}
                  >
                    <AddCircleIcon className={styles.svg} />
                  </button>
                </ElementActions>
              </ElementHeader>
              <ElementList>
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <ElementListItem
                      key={activity.name}
                      index={index}
                      leftElement={<div className={styles["activity-index"]}>{index + 1}</div>}
                      label={activity.name}
                      showActions={{ info: false, edit: true, delete: true, lock: false }}
                      onEdit={() => handleEdit(activity)}
                      onDelete={() => deleteActivity(index)}
                      draggable={true}
                      onDropItem={(order) => {
                        const draggedIndex = order
                        const droppedIndex = index
                        if (order !== droppedIndex) {
                          const updatedActivities = [...activities]
                          const draggedActivity = updatedActivities[draggedIndex]
                          updatedActivities.splice(draggedIndex, 1)
                          updatedActivities.splice(droppedIndex, 0, draggedActivity)
                          setActivities(updatedActivities)
                        }
                      }}
                    />
                  ))
                ) : (
                  <ElementListItem
                    label="Add activities to the research protocol"
                    showActions={false}
                    onClick={handleAddActivity}
                  />
                )}
              </ElementList>
            </PanelElement>
          </ModalBody>
          <ModalFooter>
            <Button type="submit" form="create">
              UPDATE
            </Button>
            <Button styleType="danger" onClick={() => window.close()}>
              CLOSE
            </Button>
          </ModalFooter>
        </>
      )}
    </PageModal>
  )
}
