import { Tree, TreeSelection } from '@openenergytools/tree-grid';

export function getLNodeTypes(doc: XMLDocument | undefined): Element[] {
  return Array.from(
    doc?.querySelectorAll(':root > DataTypeTemplates > LNodeType') ?? []
  );
}

export function getSelectedLNodeType(
  doc: XMLDocument,
  selected: string
): Element | undefined {
  return (
    doc?.querySelector(
      `:root > DataTypeTemplates > LNodeType[id="${selected}"]`
    ) ?? undefined
  );
}

export function isLNodeTypeReferenced(
  doc: XMLDocument,
  selectedLNodeTypeID: string | null
): boolean {
  if (!doc || !selectedLNodeTypeID) return false;
  return !!doc.querySelector(
    `:root > Substation LNode[lnType="${selectedLNodeTypeID}"], :root > IED LN[lnType="${selectedLNodeTypeID}"], :root > IED LN0[lnType="${selectedLNodeTypeID}"]`
  );
}

export function filterSelection(
  tree: Tree,
  selection: TreeSelection
): TreeSelection {
  const filteredTree: TreeSelection = {};
  Object.keys(selection).forEach(key => {
    const isThere = !!tree[key];
    if (isThere) filteredTree[key] = selection[key];
  });

  return filteredTree;
}
