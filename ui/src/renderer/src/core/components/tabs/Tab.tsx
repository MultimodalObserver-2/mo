export interface TabProps {
  /** Title of the tab */
  title: string
  /** Content of the tab */
  children: React.ReactNode
}

/**
 * A data-only component used to define a single tab within a `Tabs` component.
 * It renders no UI itself; instead, its props (`title` and `children`) are
 * consumed by the parent `Tabs` component to construct the tabbed interface.
 *
 * @param {string} props.title - The text to be displayed on the tab's button.
 * @param {React.ReactNode} props.children - The content to be rendered inside the tab panel when this tab is active.
 * @returns {null} This component does not render anything.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Tab(_props: Readonly<TabProps>) {
  return null
}
