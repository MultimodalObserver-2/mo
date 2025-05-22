import { Children, isValidElement, ReactElement } from "react"

export function findChildByDisplayName<T extends ReactElement>(
  children: React.ReactNode,
  name: string
): T | undefined {
  return Children.toArray(children).find(
    (child): child is T =>
      isValidElement(child) &&
      typeof child.type === "function" &&
      (child.type as { displayName?: string }).displayName === name
  )
}
