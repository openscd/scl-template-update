export function getLNodeTypes(doc) {
    var _a;
    return Array.from((_a = doc === null || doc === void 0 ? void 0 : doc.querySelectorAll(':root > DataTypeTemplates > LNodeType')) !== null && _a !== void 0 ? _a : []);
}
export function getSelectedLNodeType(doc, selected) {
    var _a;
    return ((_a = doc === null || doc === void 0 ? void 0 : doc.querySelector(`:root > DataTypeTemplates > LNodeType[id="${selected}"]`)) !== null && _a !== void 0 ? _a : undefined);
}
export function isLNodeTypeReferenced(doc, selectedLNodeTypeID) {
    if (!doc || !selectedLNodeTypeID)
        return false;
    return !!doc.querySelector(`:root > Substation LNode[lnType="${selectedLNodeTypeID}"], :root > IED LN[lnType="${selectedLNodeTypeID}"], :root > IED LN0[lnType="${selectedLNodeTypeID}"]`);
}
export function filterSelection(tree, selection) {
    const filteredTree = {};
    Object.keys(selection).forEach(key => {
        const isThere = !!tree[key];
        if (isThere)
            filteredTree[key] = selection[key];
    });
    return filteredTree;
}
//# sourceMappingURL=utils.js.map