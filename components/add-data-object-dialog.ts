/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { MdDialog } from '@scopedelement/material-web/dialog/MdDialog.js';
import { MdOutlinedTextField } from '@scopedelement/material-web/textfield/MdOutlinedTextField.js';
import { MdFilledSelect } from '@scopedelement/material-web/select/MdOutlineSelect.js';
import { MdSelectOption } from '@scopedelement/material-web/select/MdSelectOption.js';
import { MdOutlinedButton } from '@scopedelement/material-web/button/outlined-button.js';
import { MdTextButton } from '@scopedelement/material-web/button/text-button.js';

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

  @property({ type: Array })
  cdClasses: string[] = [];

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

    this.createDOdialog.close();
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

    return isValid;
  }

  private onAddDataObjectSubmit(e: Event) {
    e.preventDefault();
    if (!this.validateForm()) return;
    const cdcType = this.cdcType.value;
    const doName = this.doName.value;
    this.dispatchEvent(
      new CustomEvent('add-data-object', {
        detail: { cdcType, doName },
        bubbles: true,
        composed: true,
      })
    );
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
            @input=${this.resetErrorText}
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
