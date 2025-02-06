/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-plusplus */
/* eslint-disable no-loop-func */
/* eslint-disable no-nested-ternary */
import { LitElement, html, css, TemplateResult } from 'lit';
import { state, query, property } from 'lit/decorators.js';

import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { newEditEvent } from '@openenergytools/open-scd-core';

import {
  insertSelectedLNodeType,
  lNodeTypeToSelection,
  nsdToJson,
  removeDataType,
} from '@openenergytools/scl-lib';

import { TreeGrid, TreeSelection } from '@openenergytools/tree-grid';

import { MdFilledButton } from '@scopedelement/material-web/button/MdFilledButton.js';
import { MdOutlinedButton } from '@scopedelement/material-web/button/MdOutlinedButton.js';
import { MdDialog } from '@scopedelement/material-web/dialog/MdDialog.js';
import { MdFab } from '@scopedelement/material-web/fab/MdFab.js';
import { MdIcon } from '@scopedelement/material-web/icon/MdIcon.js';
import { MdFilledSelect } from '@scopedelement/material-web/select/MdFilledSelect.js';
import { MdSelectOption } from '@scopedelement/material-web/select/MdSelectOption.js';

let lastLNodeTypeID = '';
let lastSelection = {};
let lastFilter = '';

function filterSelection(tree: any, selection: TreeSelection): TreeSelection {
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
  };

  @state()
  doc?: XMLDocument;

  @property({ type: Number })
  docVersion!: number;

  @query('tree-grid')
  treeUI!: TreeGrid;

  @state()
  get filter(): string {
    if (!this.treeUI) return '';
    return this.treeUI.filter ?? '';
  }

  set filter(filter: string) {
    this.treeUI.filter = filter;
  }

  @query('md-filled-select')
  lNodeTypeUI?: MdFilledSelect;

  @query('.dialog.warning') warningDialog?: MdDialog;

  @query('.dialog.choice') choiceDialog?: MdDialog;

  @state()
  get lNodeTypeValue(): string {
    return this.lNodeTypeUI?.value || lastLNodeTypeID;
  }

  @state()
  addedLNode = '';

  @state()
  selectedLNodeType?: Element;

  @state()
  lNodeTypeSelection?: TreeSelection;

  @state()
  nsdSelection?: TreeSelection;

  @state()
  warningMsg: string = '';

  get lNodeTypes(): Element[] {
    return Array.from(
      this.doc?.querySelectorAll(':root > DataTypeTemplates > LNodeType') ?? []
    );
  }

  showWarning(msg: string): void {
    this.warningMsg = msg;
    this.warningDialog?.show();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    lastSelection = this.lNodeTypeSelection ?? {};
    lastFilter = this.filter;
    lastLNodeTypeID = this.lNodeTypeValue;
  }

  async saveTemplates() {
    if (!this.doc || !this.nsdSelection) return;

    const lnClass = this.selectedLNodeType!.getAttribute('lnClass')!;
    const lnID = this.selectedLNodeType!.getAttribute('id')!;

    const inserts = insertSelectedLNodeType(
      this.doc,
      this.nsdSelection,
      lnClass
    );
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

    if (lnID) this.addedLNode = lnID;
  }

  proceedWithDataLoss() {
    this.choiceDialog?.close();
    this.saveTemplates();
  }

  updateTemplate(): void {
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

  onLNodeTypeSelect() {
    this.selectedLNodeType =
      this.doc?.querySelector(
        `:root > DataTypeTemplates > LNodeType[id="${this.lNodeTypeValue}"]`
      ) ?? undefined;
    const selectedLNodeTypeClass =
      this.selectedLNodeType?.getAttribute('lnClass');
    if (!selectedLNodeTypeClass) return;

    const tree = nsdToJson(selectedLNodeTypeClass) as any;

    if (!tree) {
      this.showWarning(`Selected Ligical Node Class not defined in the NSD.`);
      return;
    }

    const selectedLNodeTypeID = this.selectedLNodeType?.getAttribute('id');
    const isReferenced = this.doc?.querySelector(
      `:root > Substation LNode[lnType="${selectedLNodeTypeID}"], :root > IED LN[lnType="${selectedLNodeTypeID}"], :root > IED LN0[lnType="${selectedLNodeTypeID}"]`
    );
    if (isReferenced)
      this.showWarning(
        `The selected logical node type is referenced. This plugin should be used during specification only.`
      );

    this.lNodeTypeSelection = lNodeTypeToSelection(this.selectedLNodeType!);

    this.treeUI.tree = tree;
    this.treeUI.selection = this.lNodeTypeSelection;

    this.filter = '';
    this.requestUpdate();
    this.treeUI.requestUpdate();
  }

  // eslint-disable-next-line class-methods-use-this
  renderWarning(): TemplateResult {
    return html`<md-dialog class="dialog warning">
      <div slot="headline">Warning</div>
      <form slot="content" id="form-id" method="dialog">
        ${this.warningMsg}
      </form>
      <div slot="actions">
        <md-outlined-button
          class="button close"
          form="form-id"
          @click="${() => this.warningDialog!.close()}"
          >Close</md-outlined-button
        >
      </div>
    </md-dialog>`;
  }

  renderChoice(): TemplateResult {
    return html`<md-dialog class="dialog choice">
      <div slot="headline">Waring: Data loss</div>
      <form slot="content" id="form-id" method="dialog">
        The logical node has additional data object not defined in the NSD.
        Updating will lead to loss of data! Do you still want to proceed?
      </form>
      <div slot="actions">
        <md-outlined-button
          class="button close"
          form="form-id"
          @click="${() => this.choiceDialog!.close()}"
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
    return html`<md-fab
      label="Update Logical Node Type"
      @click=${() => this.updateTemplate()}
    ></md-fab>`;
  }

  renderLNodeTypeSelector(): TemplateResult {
    return html`<md-filled-select @change=${() => this.onLNodeTypeSelect()}>
      ${Array.from(this.lNodeTypes).map(
        lNodeType =>
          html`<md-select-option value=${lNodeType.getAttribute('id')}
            ><div slot="headline">
              ${lNodeType.getAttribute('id')}
            </div></md-select-option
          >`
      )}
    </md-filled-select>`;
  }

  render() {
    if (!this.doc) return html`<h1>Load SCL document first!</h1>`;

    return html`<div class="container">
        ${this.renderLNodeTypeSelector()}
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

    md-fab {
      position: fixed;
      bottom: 32px;
      right: 32px;
    }

    md-filled-select {
      position: absolute;
      left: 300px;
    }
  `;
}
