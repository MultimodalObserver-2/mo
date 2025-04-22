import styles from "./element-list.module.css"
import InfoIcon from "@renderer/core/components/icons/InfoIcon"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import DeleteIcon from "@renderer/core/components/icons/DeleteIcon"
import Show from "@renderer/core/components/show/Show"

export const ElementListItem = ({
  label,
  showActions = false,
  onClick,
  onInfo,
  onEdit,
  onDelete
}: {
  label: string
  showActions?: boolean | { info: boolean; edit: boolean; delete: boolean }
  onClick?: () => void
  onInfo?: () => void
  onEdit?: () => void
  onDelete?: () => void
}) => {
  return (
    <li className={`${styles.item}`} tabIndex={0} onClick={onClick}>
      <h4 className={styles.name}>{label}</h4>
      <Show show={!!showActions}>
        <div className={styles.actions}>
          <Show show={typeof showActions === "boolean" ? showActions : showActions.info}>
            <InfoIcon className={`${styles.action} ${styles.normal}`} onClick={onInfo} />
          </Show>
          <Show show={typeof showActions === "boolean" ? showActions : showActions.edit}>
            <EditIcon className={`${styles.action} ${styles.normal}`} onClick={onEdit} />
          </Show>
          <Show show={typeof showActions === "boolean" ? showActions : showActions.delete}>
            <DeleteIcon className={`${styles.action} ${styles.danger}`} onClick={onDelete} />
          </Show>
        </div>
      </Show>
    </li>
  )
}

export function ElementList({ children }: { children: React.ReactNode }) {
  return <ul className={styles.items}>{children}</ul>
}
