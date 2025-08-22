/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { Tree, TreeNode } from '@openenergytools/tree-grid';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { MdDialog } from '@scopedelement/material-web/dialog/MdDialog.js';
import { MdOutlinedTextField } from '@scopedelement/material-web/textfield/MdOutlinedTextField.js';
import { MdFilledSelect } from '@scopedelement/material-web/select/MdOutlineSelect.js';
import { MdSelectOption } from '@scopedelement/material-web/select/MdSelectOption.js';
import { MdOutlinedButton } from '@scopedelement/material-web/button/outlined-button.js';
import { MdTextButton } from '@scopedelement/material-web/button/text-button.js';
import { debounce } from '../utils/debounce.js';

// eslint-disable-next-line no-shadow
enum DONameStatus {
  Ok = 'Ok',
  Taken = 'Taken',
  InvalidCDC = 'InvalidCDC',
  CustomNamespaceNeeded = 'CustomNamespaceNeeded',
}

const firstTextBlockRegExp = /[A-Za-z]+/;

export class AddDataObjectDialog extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'md-outlined-button': MdOutlinedButton,
    'md-dialog': MdDialog,
    'md-outlined-text-field': MdOutlinedTextField,
    'md-text-button': MdTextButton,
    'md-select-option': MdSelectOption,
    'md-filled-select': MdFilledSelect,
  };

  static styles = css`
    md-dialog {
      min-width: 350px;
    }
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 8px;
    }
    md-filled-select,
    md-outlined-text-field {
      width: 100%;
    }
    md-text-button {
      text-transform: uppercase;
    }
  `;

  @property()
  tree: Partial<Record<string, TreeNode>> = {};

  @property({ type: Array })
  cdClasses: string[] = [];

  @property({ type: Function })
  onConfirm?: (
    cdcType: string,
    doName: string,
    namespace: string | null
  ) => void;

  @state()
  open = false;

  @state()
  errorText = '';

  @query('md-dialog')
  createDOdialog!: MdDialog;

  @query('#cdc-type')
  cdcType!: MdFilledSelect;

  @query('#do-name')
  doName!: MdOutlinedTextField;

  @query('#namespace')
  namespace!: MdOutlinedTextField;

  private namespaceDefaultValue = 'User-Defined';

  private validationDebounceDelay = 300;

  @state()
  private isCustomNamespaceDisabled = true;

  show() {
    this.createDOdialog.show();
  }

  close() {
    if (this.cdcType) {
      this.cdcType.errorText = '';
      this.cdcType.error = false;
      this.cdcType.reset();
    }

    if (this.doName) {
      this.doName.errorText = '';
      this.doName.error = false;
      this.doName.value = '';
    }

    if (this.namespace) {
      this.namespace.errorText = '';
      this.namespace.error = false;
      this.namespace.value = '';
      this.isCustomNamespaceDisabled = true;
    }

    this.createDOdialog.close();
  }

  private getMultiTree() {
    return Object.keys(this.tree)
      .filter(key => (this.tree[key] as any).presCond === 'Omulti')
      .reduce((acc, key) => {
        acc[key] = this.tree[key];
        return acc;
      }, {} as any);
  }

  // eslint-disable-next-line class-methods-use-this
  private findMatchingTreeNode(doName: string, multiTree: any) {
    const firstTextBlockMatch = doName.match(firstTextBlockRegExp);

    if (!firstTextBlockMatch) {
      return null;
    }

    const firstTextBlock = firstTextBlockMatch[0];
    const matchingNode = multiTree[`${firstTextBlock}1`];

    return matchingNode || null;
  }

  private getDONameStatus(): DONameStatus {
    const doNameValue = this.doName.value;
    const cdcValue = this.cdcType.value;
    const isTaken = doNameValue in this.tree;

    if (isTaken) {
      return DONameStatus.Taken;
    }

    const multiTree = this.getMultiTree();
    const matchingTreeNode = this.findMatchingTreeNode(doNameValue, multiTree);

    if (matchingTreeNode) {
      const doCDCsMatch = cdcValue === matchingTreeNode.type;

      if (!doCDCsMatch) {
        return DONameStatus.InvalidCDC;
      }
      return DONameStatus.Ok;
    }

    return DONameStatus.CustomNamespaceNeeded;
  }

  private onValueChange = debounce(() => {
    if (!this.cdcType.value || !this.doName.value) {
      this.isCustomNamespaceDisabled = true;
      return;
    }

    const status = this.getDONameStatus();
    this.setDONameStatusError(status);

    this.isCustomNamespaceDisabled =
      status !== DONameStatus.CustomNamespaceNeeded;
  }, this.validationDebounceDelay);

  private setDONameStatusError(status: DONameStatus): void {
    if (status === DONameStatus.Taken) {
      this.doName.errorText = 'DO name already in use';
      this.doName.error = true;
    } else {
      this.doName.errorText = '';
      this.doName.error = false;
    }

    if (status === DONameStatus.InvalidCDC) {
      this.cdcType.errorText = 'CDC type invalid for this DO';
      this.cdcType.error = true;
    } else {
      this.cdcType.errorText = '';
      this.cdcType.error = false;
    }
  }

  private validateForm(): boolean {
    let isValid = true;

    if (!this.cdcType?.value) {
      this.cdcType.errorText = 'Please select a common data class.';
      this.cdcType.error = true;
      isValid = false;
    } else {
      this.cdcType.errorText = '';
      this.cdcType.error = false;
    }

    if (!this.doName?.checkValidity()) {
      this.doName.errorText = 'Not a valid DO name.';
      this.doName.error = true;
      isValid = false;
    } else {
      this.doName.errorText = '';
      this.doName.error = false;
    }

    const status = this.getDONameStatus();

    if (status === DONameStatus.CustomNamespaceNeeded) {
      if (!this.namespace.value) {
        this.namespace.errorText = 'Custom namespace required.';
        this.namespace.error = true;
        isValid = false;
      }
    } else if (
      status === DONameStatus.Taken ||
      status === DONameStatus.InvalidCDC
    ) {
      this.setDONameStatusError(status);
      isValid = false;
    }

    return isValid;
  }

  private onAddDataObjectSubmit(e: Event) {
    e.preventDefault();
    if (!this.validateForm()) return;
    const status = this.getDONameStatus();

    const cdcType = this.cdcType.value;
    const doName = this.doName.value;
    const namespace =
      status === DONameStatus.CustomNamespaceNeeded
        ? this.namespace.value
        : null;

    this.onConfirm?.(cdcType, doName, namespace);
    this.close();
  }

  /* eslint-disable class-methods-use-this */
  private resetErrorText(e: Event): void {
    const target = e.target as MdOutlinedTextField;
    if (target.errorText && target.checkValidity()) {
      target.errorText = '';
      target.error = false;
    }
  }

  render() {
    return html`
      <md-dialog @closed=${this.close}>
        <div slot="headline">Add Data Object</div>
        <form
          slot="content"
          id="add-data-object"
          class="dialog-content"
          novalidate
          @submit=${this.onAddDataObjectSubmit}
          @reset=${this.close}
        >
          <md-filled-select
            class="cdc-type"
            label="Common Data Class"
            required
            id="cdc-type"
            @input=${(e: Event) => {
              this.resetErrorText(e);
              this.onValueChange();
            }}
          >
            ${this.cdClasses.map(
              cdClass =>
                html`<md-select-option value=${cdClass}
                  >${cdClass}</md-select-option
                >`
            )}
          </md-filled-select>
          <md-outlined-text-field
            label="Data Object Name"
            id="do-name"
            required
            maxlength="12"
            pattern="[A-Z][0-9A-Za-z]*"
            @input=${(e: Event) => {
              this.resetErrorText(e);
              this.onValueChange();
            }}
          ></md-outlined-text-field>
          <md-outlined-text-field
            id="namespace"
            label="Namespace"
            placeholder=${this.namespaceDefaultValue}
            required
            .disabled=${this.isCustomNamespaceDisabled}
            @input=${this.resetErrorText}
          ></md-outlined-text-field>
        </form>
        <div slot="actions">
          <md-text-button form="add-data-object" type="reset"
            >Close</md-text-button
          >
          <md-text-button form="add-data-object" type="submit"
            >Add</md-text-button
          >
        </div>
      </md-dialog>
    `;
  }
}

export default AddDataObjectDialog;
