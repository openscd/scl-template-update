/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css, TemplateResult } from 'lit';
import { state, query, property } from 'lit/decorators.js';

import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { newEditEvent } from '@openenergytools/open-scd-core';

import {
  insertSelectedLNodeType,
  lNodeTypeToSelection,
  nsdToJson,
  removeDataType,
  LNodeDescription,
} from '@openenergytools/scl-lib';

import { Tree, TreeGrid, TreeSelection } from '@openenergytools/tree-grid';

import { MdFilledButton } from '@scopedelement/material-web/button/MdFilledButton.js';
import { MdOutlinedButton } from '@scopedelement/material-web/button/MdOutlinedButton.js';
import { MdDialog } from '@scopedelement/material-web/dialog/MdDialog.js';
import { MdFab } from '@scopedelement/material-web/fab/MdFab.js';
import { MdIcon } from '@scopedelement/material-web/icon/MdIcon.js';
import { MdFilledSelect } from '@scopedelement/material-web/select/MdFilledSelect.js';
import { MdSelectOption } from '@scopedelement/material-web/select/MdSelectOption.js';
import { MdCircularProgress } from '@scopedelement/material-web/progress/circular-progress.js';

import { cdClasses } from './constants.js';

function filterSelection(tree: Tree, selection: TreeSelection): TreeSelection {
  const filteredTree: TreeSelection = {};
  Object.keys(selection).forEach(key => {
    const isThere = !!tree[key];
    if (isThere) filteredTree[key] = selection[key];
  });

  return filteredTree;
}

export default class NsdTemplateUpdated extends ScopedElementsMixin(
  LitElement
) {
  static scopedElements = {
    'tree-grid': TreeGrid,
    'md-filled-select': MdFilledSelect,
    'md-select-option': MdSelectOption,
    'md-fab': MdFab,
    'md-icon': MdIcon,
    'md-dialog': MdDialog,
    'md-filled-button': MdFilledButton,
    'md-outlined-button': MdOutlinedButton,
    'md-circular-progress': MdCircularProgress,
  };

  @property()
  doc?: XMLDocument;

  @query('tree-grid')
  treeUI!: TreeGrid;

  @query('md-filled-select')
  lNodeTypeUI?: MdFilledSelect;

  @query('#dialog-warning')
  warningDialog?: MdDialog;

  @query('#dialog-choice')
  choiceDialog?: MdDialog;

  @state()
  lNodeTypes: Element[] = [];

  @state()
  selectedLNodeType?: Element;

  @state()
  lNodeTypeSelection?: TreeSelection;

  @state()
  nsdSelection?: TreeSelection;

  @state()
  warningMsg: string = '';

  @state()
  loading = false;

  @state()
  fabLabel: string = 'Update Logical Node Type';

  updated(changedProperties: Map<string, unknown>) {
    super.updated?.(changedProperties);
    if (changedProperties.has('doc')) {
      this.resetUI(true);
      this.getlNodeTypes();
    }
  }

  private async getlNodeTypes() {
    this.lNodeTypes = Array.from(
      this.doc?.querySelectorAll(':root > DataTypeTemplates > LNodeType') ?? []
    );
  }

  private resetUI(full: boolean = false): void {
    if (full) {
      this.selectedLNodeType = undefined;
      this.lNodeTypeSelection = undefined;
      this.nsdSelection = undefined;
      this.lNodeTypeUI?.reset();
    }
    if (this.treeUI) {
      this.treeUI.tree = {};
      this.treeUI.selection = {};
      this.treeUI.requestUpdate();
    }
  }

  private showWarning(msg: string): void {
    this.warningMsg = msg;
    this.warningDialog?.show();
  }

  private closeWarningDialog(): void {
    this.warningDialog?.close();
  }

  private closeChoiceDialog(): void {
    this.choiceDialog?.close();
  }

  private async saveTemplates() {
    if (!this.doc || !this.nsdSelection) return;

    const lnClass = this.selectedLNodeType!.getAttribute('lnClass')!;
    const lnID = this.selectedLNodeType!.getAttribute('id')!;
    const inserts = insertSelectedLNodeType(this.doc, this.nsdSelection, {
      class: lnClass,
      data: this.treeUI.tree as LNodeDescription,
    });

    if (inserts.length === 0) return; // no changes in LNodeType

    this.dispatchEvent(newEditEvent(inserts));
    await this.updateComplete;

    const remove = removeDataType(
      { node: this.selectedLNodeType! },
      { force: true }
    );
    this.dispatchEvent(
      newEditEvent(remove, { squash: true, title: `Update ${lnID}` })
    );
    this.getlNodeTypes();

    const updatedLNodeType = inserts.find(
      insert => (insert.node as Element).tagName === 'LNodeType'
    )?.node as Element;

    if (updatedLNodeType) {
      const updatedLNodeTypeID = updatedLNodeType.getAttribute('id');
      this.selectedLNodeType = updatedLNodeType;
      await this.updateComplete;

      if (this.lNodeTypeUI && updatedLNodeType) {
        this.lNodeTypeUI.value = updatedLNodeType.getAttribute('id') ?? '';
      }

      this.fabLabel = `${updatedLNodeTypeID} updated!`;

      setTimeout(() => {
        this.fabLabel = 'Update Logical Node Type';
      }, 5000);
    }
  }

  private proceedWithDataLoss() {
    this.closeChoiceDialog();
    this.saveTemplates();
  }

  private handleUpdateTemplate(): void {
    if (!this.doc || !this.selectedLNodeType) return;

    this.nsdSelection = filterSelection(
      this.treeUI.tree,
      this.treeUI.selection
    );

    if (
      JSON.stringify(this.treeUI.selection) !==
      JSON.stringify(this.nsdSelection)
    ) {
      this.choiceDialog?.show();
      return;
    }

    this.saveTemplates();
  }

  /**
   * Merges user-defined Data Objects in the NSD tree. This ensures that
   * any custom or extra DOs present in the user's SCL are preserved
   * in the tree, even if they are not part of the NSD definition.
   */
  private mergeUserDOsIntoTree(
    tree: any,
    lNodeType: Element
  ): { tree: LNodeDescription; unsupportedDOs: string[] } {
    if (!lNodeType || !this.doc) return { tree, unsupportedDOs: [] };
    const result = { ...tree };
    const doElements = Array.from(lNodeType.querySelectorAll(':scope > DO'));
    const standardDONames = tree ? Object.keys(tree) : [];
    const unsupportedDOs: string[] = [];
    doElements.forEach(doEl => {
      const doName = doEl.getAttribute('name');
      const doType = doEl.getAttribute('type');
      if (!doName || !doType) return;
      if (!standardDONames.includes(doName)) {
        const doTypeElement = this.doc!.querySelector(
          `:root > DataTypeTemplates > DOType[id="${doType}"]`
        );
        const cdc = doTypeElement?.getAttribute('cdc');
        const isCdcSupported =
          cdc && (cdClasses as ReadonlyArray<string>).includes(cdc);
        if (isCdcSupported) {
          const cdcChildren = nsdToJson(cdc);
          const cdcDescription = {
            tagName: 'DataObject',
            type: cdc,
            descID: '',
            presCond: 'O',
            children: cdcChildren,
          };
          result[doName] = cdcDescription;
        } else {
          unsupportedDOs.push(doName);
        }
      }
    });
    return { tree: result, unsupportedDOs };
  }

  private getSelectedLNodeType(selected: string): Element | undefined {
    return (
      this.doc?.querySelector(
        `:root > DataTypeTemplates > LNodeType[id="${selected}"]`
      ) ?? undefined
    );
  }

  private buildLNodeTree(
    selectedLNodeTypeClass: string,
    lNodeType: Element
  ): { tree: any; unsupportedDOs: string[] } {
    const tree = nsdToJson(selectedLNodeTypeClass) as any;
    if (!tree) return { tree: undefined, unsupportedDOs: [] };
    return this.mergeUserDOsIntoTree(tree, lNodeType);
  }

  private isLNodeTypeReferenced(selectedLNodeTypeID: string | null): boolean {
    if (!this.doc || !selectedLNodeTypeID) return false;
    return !!this.doc.querySelector(
      `:root > Substation LNode[lnType="${selectedLNodeTypeID}"], :root > IED LN[lnType="${selectedLNodeTypeID}"], :root > IED LN0[lnType="${selectedLNodeTypeID}"]`
    );
  }

  async onLNodeTypeSelect(e: Event): Promise<void> {
    const target = e.target as MdFilledSelect;
    this.loading = true;
    // Let the browser render the loader before heavy work
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });

    this.resetUI(false);

    this.selectedLNodeType = this.getSelectedLNodeType(target.value);

    const selectedLNodeTypeClass =
      this.selectedLNodeType?.getAttribute('lnClass');

    if (!selectedLNodeTypeClass || !this.selectedLNodeType) {
      this.loading = false;
      return;
    }

    const { tree, unsupportedDOs } = this.buildLNodeTree(
      selectedLNodeTypeClass,
      this.selectedLNodeType
    );

    if (!tree) {
      this.loading = false;
      this.showWarning('Selected Logical Node Class not defined in the NSD.');
      return;
    }

    if (unsupportedDOs.length > 0) {
      this.showWarning(
        'The selected logical node type contains user-defined data objects with unsupported CDCs.'
      );
    }

    const selectedLNodeTypeID = this.selectedLNodeType.getAttribute('id');
    const isReferenced = this.isLNodeTypeReferenced(selectedLNodeTypeID);

    this.lNodeTypeSelection = lNodeTypeToSelection(this.selectedLNodeType);
    this.treeUI.tree = tree;
    this.treeUI.selection = this.lNodeTypeSelection;
    this.requestUpdate();
    this.treeUI.requestUpdate();
    await this.updateComplete;
    this.loading = false;

    if (isReferenced)
      this.showWarning(
        'The selected logical node type is referenced. This plugin should be used during specification only.'
      );
  }

  // eslint-disable-next-line class-methods-use-this
  renderWarning(): TemplateResult {
    return html`<md-dialog id="dialog-warning">
      <div slot="headline">Warning</div>
      <form slot="content" id="form-id" method="dialog">
        ${this.warningMsg}
      </form>
      <div slot="actions">
        <md-outlined-button
          class="button close"
          form="form-id"
          @click="${this.closeWarningDialog}"
          >Close</md-outlined-button
        >
      </div>
    </md-dialog>`;
  }

  renderChoice(): TemplateResult {
    return html`<md-dialog id="dialog-choice">
      <div slot="headline">Warning: Data loss</div>
      <form slot="content" id="form-id" method="dialog">
        The logical node has additional data object not defined in the NSD.
        Updating will lead to loss of data! Do you still want to proceed?
      </form>
      <div slot="actions">
        <md-outlined-button
          class="button close"
          form="form-id"
          @click="${this.closeChoiceDialog}"
          >Cancel</md-outlined-button
        >
        <md-outlined-button
          class="button proceed"
          form="form-id"
          @click="${this.proceedWithDataLoss}"
          >Proceed</md-outlined-button
        >
      </div>
    </md-dialog>`;
  }

  renderFab(): TemplateResult {
    const disabled =
      !this.treeUI?.tree || Object.keys(this.treeUI?.tree).length === 0;
    return html`<md-fab
      label="${this.fabLabel}"
      class="update-lnode-type"
      ?disabled="${disabled}"
      @click=${this.handleUpdateTemplate}
    ></md-fab>`;
  }

  renderLNodeTypeSelector(): TemplateResult {
    return html`
      <md-filled-select @change=${this.onLNodeTypeSelect}>
        ${this.lNodeTypes.map(
          lNodeType =>
            html`<md-select-option value=${lNodeType.getAttribute('id')}>
              <div slot="headline">${lNodeType.getAttribute('id')}</div>
            </md-select-option>`
        )}
      </md-filled-select>
    `;
  }

  renderLoader(): TemplateResult {
    return this.loading
      ? html`<md-circular-progress indeterminate></md-circular-progress>`
      : html``;
  }

  render() {
    if (!this.doc) return html`<h1>Load SCL document first!</h1>`;

    return html`<div class="container">
        <div class="select-row">
          ${this.renderLNodeTypeSelector()} ${this.renderLoader()}
        </div>
        <tree-grid></tree-grid>
      </div>
      ${this.renderFab()} ${this.renderWarning()} ${this.renderChoice()} `;
  }

  static styles = css`
    * {
      --md-sys-color-primary: var(--oscd-primary);
      --md-sys-color-secondary: var(--oscd-secondary);
      --md-sys-typescale-body-large-font: var(--oscd-theme-text-font);
      --md-outlined-text-field-input-text-color: var(--oscd-base01);

      --md-sys-color-surface: var(--oscd-base3);
      --md-sys-color-on-surface: var(--oscd-base00);
      --md-sys-color-on-primary: var(--oscd-base2);
      --md-sys-color-on-surface-variant: var(--oscd-base00);
      --md-menu-container-color: var(--oscd-base3);
      font-family: var(--oscd-theme-text-font);
      --md-sys-color-surface-container-highest: var(--oscd-base2);
      --md-list-item-activated-background: rgb(
        from var(--oscd-primary) r g b / 0.38
      );
      --md-menu-item-selected-container-color: rgb(
        from var(--oscd-primary) r g b / 0.38
      );
      --md-list-container-color: var(--oscd-base2);
      --md-fab-container-color: var(--oscd-secondary);
      --md-dialog-container-color: var(--oscd-base3);
      font-family: var(--oscd-theme-text-font, 'Roboto');
    }

    h1 {
      color: var(--oscd-base00);
      font-family: var(--oscd-theme-text-font), sans-serif;
      font-weight: 300;
      white-space: nowrap;
      line-height: 48px;
    }

    .button.close {
      --md-outlined-button-label-text-color: var(--oscd-accent-red);
      --md-outlined-button-hover-label-text-color: var(--oscd-accent-red);
    }

    .container {
      margin: 12px;
    }

    .update-lnode-type {
      position: fixed;
      bottom: 32px;
      right: 32px;
    }

    .update-lnode-type[disabled] {
      pointer-events: none;
      opacity: 0.6;
    }

    .select-row {
      display: flex;
      align-items: center;
      gap: 12px;
      position: absolute;
      left: 300px;
    }
  `;
}
