import styles from "./element-list.module.css"
import InfoIcon from "@renderer/core/components/icons/InfoIcon"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import DeleteIcon from "@renderer/core/components/icons/DeleteIcon"
import Show from "@renderer/core/components/show/Show"
import LockIcon from "@renderer/core/components/icons/LockIcon"
import LockOpenIcon from "@renderer/core/components/icons/LockOpenIcon"
import useDraggable from "./useDraggable"

interface ElementListItemProps {
  /** Label displayed as the item title */
  label: string
  /** Optional element to be displayed on the left side of the item */
  leftElement?: React.ReactNode
  /** Controls which action icons are shown (or all if boolean `true`) */
  showActions?: boolean | { info: boolean; lock: boolean; edit: boolean; delete: boolean }
  /** Highlights the item as selected */
  isSelected?: boolean
  /** Indicates whether the item is currently locked */
  isLocked?: boolean
  /** Click handler for the item itself */
  onClick?: () => void
  /** Handler for info icon click */
  onInfo?: () => void
  /** Handler for lock/unlock icon click */
  onLock?: () => void
  /** Handler for edit icon click */
  onEdit?: () => void
  /** Handler for delete icon click */
  onDelete?: () => void
  /** Indicates if the item is draggable */
  draggable?: boolean
  /** Indicates the order */
  index?: number
  /** Dropzone for the item */
  dropzoneId?: string
  /** Handler for item drop event */
  onDropItem?: (order: number) => void
}

/** List item with optional action icons like info, lock, edit, and delete */
export default function ElementListItem({
  label,
  leftElement,
  showActions = false,
  isSelected = false,
  isLocked = false,
  draggable = false,
  index,
  onDropItem = () => {},
  onClick,
  onInfo,
  onLock,
  onEdit,
  onDelete
}: Readonly<ElementListItemProps>) {
  const draggableProps = useDraggable(
    onDropItem,
    styles.dragging,
    styles["drag-over-top"],
    styles["drag-over-bottom"]
  )
  const appliedDraggableProps = draggable ? draggableProps : {}

  const showAction = (action: string) => {
    return typeof showActions === "boolean" ? showActions : showActions[action]
  }

  return (
    <li
      className={styles["item-box"]}
      id={index?.toString()}
      draggable={draggable}
      {...appliedDraggableProps}
    >
      <button
        type="button"
        className={`${styles.item} ${isSelected ? styles.active : ""}`}
        onClick={onClick}
      >
        <section className={styles["item-content"]}>
          {leftElement}
          <h4 className={styles.name}>{label}</h4>
        </section>
        <Show show={!!showActions}>
          <div className={styles.actions}>
            <Show show={showAction("info")}>
              <InfoIcon className={`${styles.action} ${styles.normal}`} onClick={onInfo} />
            </Show>
            <Show show={showAction("lock")}>
              {isLocked ? (
                <LockIcon className={`${styles.action} ${styles.normal}`} onClick={onLock} />
              ) : (
                <LockOpenIcon className={`${styles.action} ${styles.normal}`} onClick={onLock} />
              )}
            </Show>
            <Show show={showAction("edit")}>
              <EditIcon className={`${styles.action} ${styles.normal}`} onClick={onEdit} />
            </Show>
            <Show show={showAction("delete")}>
              <DeleteIcon className={`${styles.action} ${styles.danger}`} onClick={onDelete} />
            </Show>
          </div>
        </Show>
      </button>
    </li>
  )
}
