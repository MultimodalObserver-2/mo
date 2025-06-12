import { Children, isValidElement, useState } from "react"
import styles from "./tabs.module.css"
import Tab, { TabProps } from "./Tab"

interface TabsProps {
  /** One or more `Tab` components. */
  children: React.ReactElement<TabProps> | React.ReactElement<TabProps>[]
}

/**
 * A compound component that creates a tabbed interface. It uses `Tab`
 * components as children to generate the tab buttons and display the content
 * of the currently active tab.
 *
 * @param {React.ReactElement<TabProps> | React.ReactElement<TabProps>[]} props.children - One or more `Tab` components. The `title` prop of each `Tab` is used for the button label.
 * @returns {React.ReactElement | null} The rendered tabs interface, or `null` if no valid `Tab` children are provided.
 */
export default function Tabs({ children }: Readonly<TabsProps>) {
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
  /** The text to display on the tab button. */
  title: string
  /** If true, the tab is styled as active. */
  isActive: boolean
  /** Callback function to execute when the tab is clicked. */
  onClick: () => void
}

/**
 * A local presentational component that renders a single clickable tab button.
 *
 * @param {string} props.title - The text to display on the tab button.
 * @param {boolean} props.isActive - Controls the active styling of the tab.
 * @param {() => void} props.onClick - The function to call when the button is clicked.
 * @returns {React.ReactElement} The rendered button element.
 */
function TabButton({ title, isActive, onClick }: Readonly<TabButtonProps>) {
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
