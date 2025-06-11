/* eslint-disable no-unused-expressions */
import { fixture, expect, html, oneEvent } from '@open-wc/testing';
import { AddDataObjectDialog } from './add-data-object-dialog.js';
const cdClasses = ['WYE', 'DEL', 'SAV'];
window.customElements.define('add-data-object-dialog', AddDataObjectDialog);
describe('AddDataObjectDialog', () => {
    let dialog;
    beforeEach(async () => {
        dialog = await fixture(html `<add-data-object-dialog
        .cdClasses=${cdClasses}
      ></add-data-object-dialog>`);
        document.body.prepend(dialog);
    });
    afterEach(async () => {
        dialog.remove();
    });
    it('renders dialog', () => {
        var _a, _b, _c;
        expect(dialog.createDOdialog.open).to.be.false;
        dialog.show();
        expect((_a = dialog.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector('md-dialog')).to.exist;
        expect((_b = dialog.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector('md-filled-select')).to.exist;
        expect((_c = dialog.shadowRoot) === null || _c === void 0 ? void 0 : _c.querySelector('md-outlined-text-field')).to.exist;
        cdClasses.forEach(cdClass => {
            var _a;
            expect((_a = dialog.shadowRoot) === null || _a === void 0 ? void 0 : _a.textContent).to.include(cdClass);
        });
    });
    it('validates required fields', async () => {
        dialog.show();
        expect(dialog.cdcType.error).to.be.false;
        expect(dialog.doName.error).to.be.false;
        const form = dialog.shadowRoot.querySelector('form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
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
                .shadowRoot.querySelector('form')
                .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
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
//# sourceMappingURL=add-data-object-dialog.spec.js.map