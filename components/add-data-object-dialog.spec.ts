/* eslint-disable no-unused-expressions */
import { fixture, expect, html, oneEvent } from '@open-wc/testing';
import { AddDataObjectDialog } from './add-data-object-dialog.js';

const cdClasses = ['WYE', 'DEL', 'SAV'];

window.customElements.define('add-data-object-dialog', AddDataObjectDialog);

describe('AddDataObjectDialog', () => {
  let dialog: AddDataObjectDialog;
  beforeEach(async () => {
    dialog = await fixture(
      html`<add-data-object-dialog
        .cdClasses=${cdClasses}
      ></add-data-object-dialog>`
    );
    document.body.prepend(dialog);
  });

  afterEach(async () => {
    dialog.remove();
  });

  it('renders dialog', () => {
    expect(dialog.createDOdialog.open).to.be.false;
    dialog.show();
    expect(dialog.shadowRoot?.querySelector('md-dialog')).to.exist;
    expect(dialog.shadowRoot?.querySelector('md-filled-select')).to.exist;
    expect(dialog.shadowRoot?.querySelector('md-outlined-text-field')).to.exist;
    cdClasses.forEach(cdClass => {
      expect(dialog.shadowRoot?.textContent).to.include(cdClass);
    });
  });

  it('validates required fields', async () => {
    dialog.show();
    expect(dialog.cdcType.error).to.be.false;
    expect(dialog.doName.error).to.be.false;
    const form = dialog.shadowRoot!.querySelector('form')!;
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    await dialog.updateComplete;
    expect(dialog.cdcType.error).to.be.true;
    expect(dialog.doName.error).to.be.true;
  });

  it('dispatches add-data-object event on valid submit', async () => {
    dialog.show();
    const [firstCdClass] = cdClasses;
    dialog.cdcType.value = firstCdClass;
    dialog.doName.value = 'TestDO';
    await dialog.updateComplete;
    setTimeout(() => {
      dialog
        .shadowRoot!.querySelector('form')!
        .dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true })
        );
    });
    const event = await oneEvent(dialog, 'add-data-object');
    expect(event).to.exist;
    expect(event.detail).to.deep.equal({
      cdcType: cdClasses[0],
      doName: 'TestDO',
    });
  });

  it('clears form fields on close', async () => {
    dialog.show();
    const [firstCdClass] = cdClasses;
    dialog.cdcType.value = firstCdClass;
    dialog.doName.value = 'TestDO';
    await dialog.updateComplete;
    dialog.close();
    expect(dialog.cdcType.value).to.equal('');
    expect(dialog.doName.value).to.equal('');
  });
});
