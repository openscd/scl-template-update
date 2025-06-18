import { __decorate } from "tslib";
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
    constructor() {
        super(...arguments);
        this.cdClasses = [];
        this.open = false;
        this.errorText = '';
    }
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
    validateForm() {
        var _a, _b;
        let isValid = true;
        if (!((_a = this.cdcType) === null || _a === void 0 ? void 0 : _a.value)) {
            this.cdcType.errorText = 'Please select a common data class.';
            this.cdcType.error = true;
            isValid = false;
        }
        else {
            this.cdcType.errorText = '';
            this.cdcType.error = false;
        }
        if (!((_b = this.doName) === null || _b === void 0 ? void 0 : _b.checkValidity())) {
            this.doName.errorText = 'Not a valid DO name.';
            this.doName.error = true;
            isValid = false;
        }
        else {
            this.doName.errorText = '';
            this.doName.error = false;
        }
        return isValid;
    }
    onAddDataObjectSubmit(e) {
        e.preventDefault();
        if (!this.validateForm())
            return;
        const cdcType = this.cdcType.value;
        const doName = this.doName.value;
        this.dispatchEvent(new CustomEvent('add-data-object', {
            detail: { cdcType, doName },
            bubbles: true,
            composed: true,
        }));
        this.close();
    }
    /* eslint-disable class-methods-use-this */
    resetErrorText(e) {
        const target = e.target;
        if (target.errorText && target.checkValidity()) {
            target.errorText = '';
            target.error = false;
        }
    }
    render() {
        return html `
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
            ${this.cdClasses.map(cdClass => html `<md-select-option value=${cdClass}
                  >${cdClass}</md-select-option
                >`)}
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
AddDataObjectDialog.scopedElements = {
    'md-outlined-button': MdOutlinedButton,
    'md-dialog': MdDialog,
    'md-outlined-text-field': MdOutlinedTextField,
    'md-text-button': MdTextButton,
    'md-select-option': MdSelectOption,
    'md-filled-select': MdFilledSelect,
};
AddDataObjectDialog.styles = css `
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
__decorate([
    property({ type: Array })
], AddDataObjectDialog.prototype, "cdClasses", void 0);
__decorate([
    state()
], AddDataObjectDialog.prototype, "open", void 0);
__decorate([
    state()
], AddDataObjectDialog.prototype, "errorText", void 0);
__decorate([
    query('md-dialog')
], AddDataObjectDialog.prototype, "createDOdialog", void 0);
__decorate([
    query('#cdc-type')
], AddDataObjectDialog.prototype, "cdcType", void 0);
__decorate([
    query('#do-name')
], AddDataObjectDialog.prototype, "doName", void 0);
export default AddDataObjectDialog;
//# sourceMappingURL=add-data-object-dialog.js.map