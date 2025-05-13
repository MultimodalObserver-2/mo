import { Children, isValidElement, useState } from "react"
import styles from "./tabs.module.css"
import Tab, { TabProps } from "./Tab"

interface TabsProps {
  children: React.ReactElement<TabProps> | React.ReactElement<TabProps>[]
}

export default function Tabs({ children }: TabsProps) {
  const tabs = Children.toArray(children).filter(
    (child): child is React.ReactElement<TabProps> => isValidElement(child) && child.type === Tab
  )
  const [activeTabIndex, setActiveTabIndex] = useState(0)

  if (tabs.length === 0) {
    return null
  }

  return (
    <>
      <div className={styles.tabs}>
        {tabs.map((tab, idx) => {
          return (
            <TabButton
              key={tab.key ?? idx}
              title={tab.props.title}
              isActive={activeTabIndex === idx}
              onClick={() => setActiveTabIndex(idx)}
            />
          )
        })}
      </div>
      {tabs[activeTabIndex].props.children}
    </>
  )
}

interface TabButtonProps {
  title: string
  isActive: boolean
  onClick: () => void
}

function TabButton({ title, isActive, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.tab} ${isActive ? styles.active : ""}`}
      onClick={onClick}
    >
      {title}
    </button>
  )
}
