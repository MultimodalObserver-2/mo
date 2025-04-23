import styles from "./element-list.module.css"
import InfoIcon from "@renderer/core/components/icons/InfoIcon"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import DeleteIcon from "@renderer/core/components/icons/DeleteIcon"
import Show from "@renderer/core/components/show/Show"
import LockIcon from "@renderer/core/components/icons/LockIcon"
import LockOpenIcon from "@renderer/core/components/icons/LockOpenIcon"

interface ElementListItemProps {
  label: string
  showActions?: boolean | { info: boolean; lock: boolean; edit: boolean; delete: boolean }
  isLocked?: boolean
  onClick?: () => void
  onInfo?: () => void
  onLock?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function ElementListItem({
  label,
  showActions = false,
  isLocked = false,
  onClick,
  onInfo,
  onLock,
  onEdit,
  onDelete
}: ElementListItemProps) {
  const showAction = (action: string) => {
    return typeof showActions === "boolean" ? showActions : showActions[action]
  }

  return (
    <li className={`${styles.item}`} tabIndex={0} onClick={onClick}>
      <h4 className={styles.name}>{label}</h4>
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
    </li>
  )
}
