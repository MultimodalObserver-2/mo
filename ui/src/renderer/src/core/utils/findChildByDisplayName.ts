import { Children, isValidElement, ReactElement } from "react"

/**
 * A generic utility to find the first child component in a React children
 * collection that matches a specific `displayName`.
 *
 * @template {ReactElement} T - The specific React element type that is expected to be found.
 * @param {React.ReactNode} children - The collection of React children to search through.
 * @param {string} name - The `displayName` string to match against.
 * @returns {T | undefined} The first matching child element cast to type `T`, or `undefined` if no match is found.
 */
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
