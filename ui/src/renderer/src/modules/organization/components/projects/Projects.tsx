import styles from "./projects.module.css"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"

export default function Projects() {
  const handleOnCreate = () => {
    window.core.openModalWindow(
      { width: 550, height: 310, minWidth: 550, minHeight: 310, title: "Create Project" },
      "organization/create-project"
    )
  }

  return (
    <div className={styles.box}>
      <section className={styles.top}>
        <h2 className={styles.title}>Projects</h2>
        <button className={styles["add-button"]} onClick={handleOnCreate}>
          <AddCircleIcon className={styles.svg} />
        </button>
      </section>
    </div>
  )
}
