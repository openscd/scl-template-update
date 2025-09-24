/* eslint-disable @typescript-eslint/no-unused-vars */
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { LitElement, html, css } from 'lit';
import { query, state } from 'lit/decorators.js';
import { MdDialog } from '@scopedelement/material-web/dialog/dialog.js';
import { MdTextButton } from '@scopedelement/material-web/button/text-button.js';
import { MdRadio } from '@scopedelement/material-web/radio/radio.js';
import { TEMPLATE_UPDATE_SETTING_STORAGE_KEY } from '../foundation/constants.js';

// eslint-disable-next-line no-shadow
export enum UpdateSetting {
  Swap = 'swap',
  Update = 'update',
}

export class SettingsDialog extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'md-dialog': MdDialog,
    'md-text-button': MdTextButton,
    'md-radio': MdRadio,
  };

  @query('md-dialog')
  dialog!: MdDialog;

  @state()
  private updateSetting: UpdateSetting = UpdateSetting.Update;

  connectedCallback() {
    super.connectedCallback();
    this.loadSettings();
  }

  private loadSettings() {
    const stored = localStorage.getItem(
      TEMPLATE_UPDATE_SETTING_STORAGE_KEY
    ) as UpdateSetting;
    if (stored && Object.values(UpdateSetting).includes(stored)) {
      this.updateSetting = stored;
    } else {
      this.updateSetting = UpdateSetting.Update;
    }
  }

  private saveSettings() {
    localStorage.setItem(
      TEMPLATE_UPDATE_SETTING_STORAGE_KEY,
      this.updateSetting
    );
  }

  get open() {
    return this.dialog?.open ?? false;
  }

  show() {
    this.loadSettings();
    this.dialog?.show();
  }

  close() {
    this.dialog?.close();
  }

  private handleRadioChange(event: Event) {
    const target = event.target as MdRadio;
    if (target.checked) {
      this.updateSetting = target.value as UpdateSetting;
    }
  }

  private handleConfirm() {
    this.saveSettings();
    this.close();
  }

  private handleCancel() {
    this.loadSettings();
    this.close();
  }

  render() {
    return html`
      <md-dialog @closed=${() => this.dialog?.close()}>
        <div slot="headline">LNodeType update behaviour</div>
        <div slot="content">
          <div class="radio-group">
            <label class="radio-item">
              <md-radio
                name="update-setting"
                value=${UpdateSetting.Update}
                .checked=${this.updateSetting === UpdateSetting.Update}
                @change=${this.handleRadioChange}
              ></md-radio>
              <span class="radio-label">Update logical node type </span>
            </label>
            <label class="radio-item">
              <md-radio
                name="update-setting"
                value=${UpdateSetting.Swap}
                .checked=${this.updateSetting === UpdateSetting.Swap}
                @change=${this.handleRadioChange}
              ></md-radio>
              <span class="radio-label">Swap logical node type </span>
            </label>
          </div>
        </div>
        <div slot="actions">
          <md-text-button @click=${this.handleCancel} type="button">
            Cancel
          </md-text-button>
          <md-text-button @click=${this.handleConfirm} type="button">
            Save
          </md-text-button>
        </div>
      </md-dialog>
    `;
  }

  static styles = css`
    md-dialog {
      --md-dialog-container-max-width: 400px;
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .radio-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      padding: 8px;
    }

    .radio-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .radio-label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    md-text-button {
      text-transform: uppercase;
    }
  `;
}
