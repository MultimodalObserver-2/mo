import styles from "./loading.module.css"

export default function LoadingPage() {
  return (
    <div className={styles.container}>
      <div className={styles.message}>Loading the app, please wait...</div>
      <div className={styles.spinner}></div>
    </div>
  )
}
