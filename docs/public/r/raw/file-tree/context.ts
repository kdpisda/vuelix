import type { InjectionKey, Ref } from 'vue'

export interface FileTreeNode {
  /** File or folder name shown in the tree. */
  name: string
  /** Stable id. Defaults to the node's path, e.g. `src/components/Button.vue`. */
  id?: string
  /** Present (even if empty) for folders. */
  children?: FileTreeNode[]
  /** Disables selection; folders can still be expanded. */
  disabled?: boolean
}

export interface FileTreeContext {
  selected: Ref<string | undefined>
  /** The one item that is in the tab order (roving tabindex). */
  tabbable: Readonly<Ref<string | undefined>>
  setFocused: (id: string) => void
  isExpanded: (id: string) => boolean
  activate: (id: string, node: FileTreeNode) => void
  highlightId: string
  reduced: Ref<boolean>
  indent: number
}

export interface FileTreeSlots {
  /** Replace the built-in file / folder icon. */
  icon?: (props: { node: FileTreeNode, folder: boolean, open: boolean }) => any
  /** Replace the node's label. */
  label?: (props: { node: FileTreeNode, folder: boolean }) => any
}

export const FILE_TREE_KEY: InjectionKey<FileTreeContext> = Symbol('vx-file-tree')

export function nodeId(node: FileTreeNode, parentId?: string) {
  return node.id ?? (parentId ? `${parentId}/${node.name}` : node.name)
}

export function isFolder(node: FileTreeNode) {
  return Array.isArray(node.children)
}
