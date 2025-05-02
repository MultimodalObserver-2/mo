import styles from "./add-protocol.module.css"
import Button from "@renderer/core/components/button/Button"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import ListBulletedAddIcon from "@renderer/core/components/icons/ListBulletedAddIcon"
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
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import protocolService from "@renderer/modules/organization/services/ProtocolService"
import { ActivityCreate } from "@renderer/modules/organization/types/Protocol"
import { showSelectProjectErrorMessage } from "@renderer/modules/organization/utils/dialogMessages"
import {
  openAddActivityModal,
  openEditActivityModal
} from "@renderer/modules/organization/utils/modalWindows"
import { useEffect, useState } from "react"
import { useParams } from "react-router"

export default function AddProtocolPage() {
  const { projectName } = useParams<{ projectName: string }>()
  const [activities, setActivities] = useState<ActivityCreate[]>([])

  useEffect(() => {
    const getFinalActivityName = (acts, realName: string, name = realName, num = 1) => {
      const nameExists = acts.some((activity) => activity.name === name)
      if (nameExists) {
        const newName = `${realName} (${num})`
        return getFinalActivityName(acts, realName, newName, num + 1)
      }

      return name
    }

    const addActivity = (activity) => {
      const newName = getFinalActivityName(activities, activity.name)
      activity.name = newName
      setActivities((prevActivities) => [...prevActivities, activity])
    }

    const updateActivity = (originalName: string, activity: ActivityCreate) => {
      const acts = activities.filter((act) => act.name !== originalName)
      const newName = getFinalActivityName(acts, activity.name)
      activity.name = newName
      setActivities((prevActivities) =>
        prevActivities.map((act) => (act.name === originalName ? { ...act, ...activity } : act))
      )
    }

    window.organization.onAddActivity(addActivity)
    window.organization.onUpdateActivity(updateActivity)
    return () => {
      window.organization.removeAddActivity()
      window.organization.removeUpdateActivity()
    }
  }, [activities])

  if (!projectName) {
    showSelectProjectErrorMessage()
    window.close()
    return null
  }

  const addProtocol = async (e): Promise<void> => {
    e.preventDefault()
    const protocol = {
      name: e.target.name.value,
      activities: activities
    }
    try {
      await protocolService.create(projectName, protocol)
      window.close()
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  const handleAdd = () => {
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
        <ModalTitle title="New Protocol" Icon={ListBulletedAddIcon} />
      </ModalHeader>
      <ModalBody type="form" id="create" onSubmit={addProtocol}>
        <Input label="Name" id="name" required placeholder="Enter the protocol name" type="text" />
        <PanelElement className={styles["activities-panel"]}>
          <ElementHeader>
            <ElementTitle className={styles["activities-title"]}>Activities</ElementTitle>
            <ElementActions>
              <button type="button" className={styles["add-button"]} onClick={handleAdd}>
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
                onClick={handleAdd}
              />
            )}
          </ElementList>
        </PanelElement>
      </ModalBody>
      <ModalFooter>
        <Button type="submit" form="create">
          CREATE
        </Button>
        <Button styleType="danger" onClick={() => window.close()}>
          CLOSE
        </Button>
      </ModalFooter>
    </PageModal>
  )
}
