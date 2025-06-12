import styles from "./error.module.css"

export default function ErrorPage() {
  return (
    <div className={styles.container}>
      <div className={styles.message}>
        <h1>Something went wrong</h1>
        <p>
          We&apos;re having trouble starting the application services. Please restart the app and
          try again.
        </p>
      </div>
    </div>
  )
}
