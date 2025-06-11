/* eslint-disable import/no-duplicates */
/* eslint-disable no-unused-expressions */
import { fixture, expect, html, waitUntil } from '@open-wc/testing';
import { restore, SinonSpy, spy } from 'sinon';

import '@openenergytools/open-scd-core/open-scd.js';
import { OpenSCD } from '@openenergytools/open-scd-core/open-scd.js';
import { Insert, newOpenEvent, Remove } from '@openenergytools/open-scd-core';

import {
  extension,
  lln0Selection,
  mmxuExceptSelection,
  mmxuSelection,
  nsdSpeced,
  customDataObjectInvalidCDC,
} from './scl-template-update.testfiles.js';
import './scl-template-update.js';
import NsdTemplateUpdated from './scl-template-update.js';

const plugins = {
  editor: [
    {
      name: 'Update Template',
      translations: {
        de: 'Update Template',
      },
      icon: 'edit',
      active: true,
      requireDoc: false,
      src: '/dist/scl-template-update.js',
    },
  ],
};

describe('NsdTemplateUpdater', () => {
  let openSCD: OpenSCD;
  let element: NsdTemplateUpdated;
  beforeEach(async () => {
    openSCD = await fixture(
      html`<open-scd plugins="${JSON.stringify(plugins)}"></open-scd>`
    );
    await new Promise(res => {
      setTimeout(res, 200);
    });
    element = openSCD.shadowRoot?.querySelector(
      'oscd-p837a28e71799d7bc'
    ) as NsdTemplateUpdated;
  });

  it('shows notification without loaded doc', () => {
    expect(element.shadowRoot?.querySelector('h1')).to.exist;
    expect(element.shadowRoot?.querySelector('tree-grid')).to.not.exist;
    expect(element.shadowRoot?.querySelector('md-fab')).to.not.exist;
  });

  describe('given a nsd specced document', () => {
    let listener: SinonSpy;
    afterEach(restore);
    beforeEach(async () => {
      listener = spy();
      openSCD.addEventListener('oscd-edit-v2', listener);
      const doc = new DOMParser().parseFromString(nsdSpeced, 'application/xml');
      openSCD.dispatchEvent(newOpenEvent(doc, 'SomeDoc'));
      await new Promise(res => {
        setTimeout(res, 200);
      });
    });

    it('displays an action button', () =>
      expect(element.shadowRoot?.querySelector('md-fab')).to.exist);

    it('updates MMXU on action button click', async () => {
      const event = {
        detail: { id: 'MMXU$oscd$_c53e78191fabefa3' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 0);
      });

      element.treeUI.selection = mmxuSelection;
      await element.updateComplete;

      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await element.updateComplete;

      const inserts = listener.args[0][0].detail.edit;
      const removes = listener.args[1][0].detail.edit;
      expect(inserts).to.have.lengthOf(5);
      expect(removes).to.have.lengthOf(2);

      expect(
        ((inserts[0] as Insert).node as Element).getAttribute('id')
      ).to.equal('MMXU$oscd$_b96484e663b92760');
      expect(
        ((inserts[1] as Insert).node as Element).getAttribute('id')
      ).to.equal('Beh$oscd$_954939784529ca3d');
      expect(
        ((inserts[2] as Insert).node as Element).getAttribute('id')
      ).to.equal('phsB$oscd$_65ee65af9248ae5d');
      expect(
        ((inserts[3] as Insert).node as Element).getAttribute('id')
      ).to.equal('A$oscd$_ad714f2a7845e863');
      expect(
        ((inserts[4] as Insert).node as Element).getAttribute('id')
      ).to.equal('stVal$oscd$_2ff6286b1710bcc1');

      expect(
        ((removes[0] as Remove).node as Element).getAttribute('id')
      ).to.equal('MMXU$oscd$_c53e78191fabefa3');
      expect(
        ((removes[1] as Remove).node as Element).getAttribute('id')
      ).to.equal('A$oscd$_41824603f63b26ac');
    }).timeout(5000);

    it('updates LLN0 on action button click', async () => {
      const event = {
        detail: { id: 'LLN0$oscd$_85c7ffbe25d80e63' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 0);
      });

      element.treeUI.selection = lln0Selection; // change selection
      await element.updateComplete;

      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await new Promise(res => {
        setTimeout(res, 200);
      });

      const inserts = listener.args[0][0].detail.edit;
      const removes = listener.args[1][0].detail.edit;

      expect(inserts).to.have.lengthOf(9);
      expect(removes).to.have.lengthOf(5);

      expect(
        ((inserts[0] as Insert).node as Element).getAttribute('id')
      ).to.equal('LLN0$oscd$_70973585614987f4');
      expect(
        ((inserts[1] as Insert).node as Element).getAttribute('id')
      ).to.equal('Mod$oscd$_ca3ec0d8276151d7');
      expect(
        ((inserts[2] as Insert).node as Element).getAttribute('id')
      ).to.equal('origin$oscd$_8c586402c5f97d31');
      expect(
        ((inserts[3] as Insert).node as Element).getAttribute('id')
      ).to.equal('SBOw$oscd$_59a179d1c87265eb');
      expect(
        ((inserts[4] as Insert).node as Element).getAttribute('id')
      ).to.equal('origin$oscd$_a128160f5df91cfa');
      expect(
        ((inserts[5] as Insert).node as Element).getAttribute('id')
      ).to.equal('Oper$oscd$_1c003786901c1473');
      expect(
        ((inserts[6] as Insert).node as Element).getAttribute('id')
      ).to.equal('ctlModel$oscd$_40d881a91fe5c769');
      expect(
        ((inserts[7] as Insert).node as Element).getAttribute('id')
      ).to.equal('orCat$oscd$_677850ccf85aee7a');
      expect(
        ((inserts[8] as Insert).node as Element).getAttribute('id')
      ).to.equal('orCat$oscd$_8f842fc78e972b98');

      expect(
        ((removes[0] as Remove).node as Element).getAttribute('id')
      ).to.equal('LLN0$oscd$_85c7ffbe25d80e63');
      expect(
        ((removes[1] as Remove).node as Element).getAttribute('id')
      ).to.equal('Mod$oscd$_d63dba598ea9104c');
      expect(
        ((removes[2] as Remove).node as Element).getAttribute('id')
      ).to.equal('Oper$oscd$_4974a5c5ec541314');
      expect(
        ((removes[3] as Remove).node as Element).getAttribute('id')
      ).to.equal('SBOw$oscd$_4974a5c5ec541314');
      expect(
        ((removes[4] as Remove).node as Element).getAttribute('id')
      ).to.equal('ctlModel$oscd$_f80264355419aeff');
    }).timeout(5000);

    it('does not update with same selection', async () => {
      const event = {
        detail: { id: 'LLN0$oscd$_85c7ffbe25d80e63' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await element.updateComplete;

      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await new Promise(res => {
        setTimeout(res, 200);
      });

      expect(listener).to.not.have.been.called;
    });

    it('shows the data loss dialog if (part of) selection is not in tree', async () => {
      element.selectedLNodeType = element.doc?.querySelector('LNodeType')!;
      element.treeUI.tree = { foo: {} };
      element.treeUI.selection = { foo: {}, bar: {} };
      element.treeUI.requestUpdate = () => {};
      element.nsdSelection = { foo: {} };

      (element as any).handleUpdateTemplate();
      await waitUntil(() => element.choiceDialog?.open);
      expect(element.choiceDialog?.open).to.be.true;
      expect(element.choiceDialog).shadowDom.to.equalSnapshot();
    });
  });

  describe('given a non nsd specced document', () => {
    let listener: SinonSpy;
    afterEach(restore);
    beforeEach(async () => {
      listener = spy();
      openSCD.addEventListener('oscd-edit-v2', listener);
      const doc = new DOMParser().parseFromString(extension, 'application/xml');
      openSCD.dispatchEvent(newOpenEvent(doc, 'SomeDoc'));
      await new Promise(res => {
        setTimeout(res, 200);
      });
    });

    it('does not load non NSD ln classes', async () => {
      const event = { detail: { id: 'invalidLnClass' } } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 50);
      });

      expect(JSON.stringify(element.treeUI.tree)).to.equal('{}');
      expect(element.warningDialog?.getAttribute('open')).to.not.be.null;
    });

    it('notifies with LNodeType is referenced', async () => {
      const event = {
        detail: { id: 'LLN0$oscd$_85c7ffbe25d80e63' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 200);
      });

      expect(element.warningDialog?.getAttribute('open')).to.not.be.null;
      expect(
        element.warningDialog?.querySelector('form')?.textContent
      ).to.include(
        `The selected logical node type is referenced. This plugin should be used during specification only.`
      );
    });

    it('updates MMXU on action button click', async () => {
      const event = {
        detail: { id: 'MMXU$oscd$_c53e78191fabefa3' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 0);
      });

      element.treeUI.selection = mmxuExceptSelection;
      await element.updateComplete;

      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await element.updateComplete;

      (
        element.choiceDialog?.querySelector('.button.proceed') as HTMLElement
      ).click();
      await element.updateComplete;

      const inserts = listener.args[0][0].detail.edit;
      const removes = listener.args[1][0].detail.edit;

      expect(inserts).to.have.lengthOf(5);
      expect(removes).to.have.lengthOf(1);

      expect(
        ((inserts[0] as Insert).node as Element).getAttribute('id')
      ).to.equal('MMXU$oscd$_3027abc2662ec638');
      expect(
        ((inserts[1] as Insert).node as Element).getAttribute('id')
      ).to.equal('Beh$oscd$_954939784529ca3d');
      expect(
        ((inserts[2] as Insert).node as Element).getAttribute('id')
      ).to.equal('phsB$oscd$_65ee65af9248ae5d');

      expect(
        ((removes[0] as Remove).node as Element).getAttribute('id')
      ).to.equal('MMXU$oscd$_c53e78191fabefa3');
    }).timeout(5000);
  });

  describe('given a document with unsupported CDC', () => {
    afterEach(restore);
    beforeEach(async () => {
      openSCD.addEventListener('oscd-edit-v2', () => {});
      const doc = new DOMParser().parseFromString(
        customDataObjectInvalidCDC,
        'application/xml'
      );
      openSCD.dispatchEvent(newOpenEvent(doc, 'SomeDoc'));
      await new Promise(res => {
        setTimeout(res, 200);
      });
      await element.updateComplete;
      const treeUI = element.shadowRoot?.querySelector('tree-grid') as any;
      if (treeUI) {
        treeUI.tree = {};
        treeUI.requestUpdate = () => {};
      }
    });

    it('shows a warning dialog when a lnode type has user defined DOs with unsupported CDC', async () => {
      const event = {
        detail: { id: 'MMXU$oscd$_c53e78191fabefa3' },
      } as CustomEvent;
      element.onLNodeTypeSelect(event);
      await new Promise(res => {
        setTimeout(res, 0);
      });

      element.treeUI.selection = mmxuSelection;
      await element.updateComplete;

      (element.shadowRoot?.querySelector('md-fab') as HTMLElement).click();
      await element.updateComplete;

      expect(element.warningDialog?.getAttribute('open')).to.not.be.null;
      expect(
        element.warningDialog?.querySelector('form')?.textContent
      ).to.include(
        'The selected logical node type contains user-defined data objects with unsupported CDCs.'
      );
    });

    it('adds a data object to the tree when form is valid', async () => {
      const dialog = element.shadowRoot?.querySelector(
        'add-data-object-dialog'
      ) as HTMLElement & { show: () => void };
      dialog.show();

      const cdcSelect = dialog.shadowRoot?.querySelector(
        '#cdc-type'
      ) as HTMLSelectElement;
      const doNameField = dialog.shadowRoot?.querySelector(
        '#do-name'
      ) as HTMLInputElement;

      cdcSelect.value = 'WYE';
      doNameField.value = 'TestDO';

      cdcSelect.dispatchEvent(new Event('input', { bubbles: true }));
      doNameField.dispatchEvent(new Event('input', { bubbles: true }));
      // Submit the form
      const form = dialog.shadowRoot?.querySelector('form')!;
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await element.updateComplete;

      expect(element.treeUI.tree).to.have.property('TestDO');
      expect(element.treeUI.tree.TestDO).to.include({
        type: 'WYE',
        tagName: 'DataObject',
        descID: '',
        presCond: 'O',
      });
    });

    it('does not add a data object if form is invalid', async () => {
      const dialog = element.shadowRoot?.querySelector(
        'add-data-object-dialog'
      ) as HTMLElement & { show: () => void };
      dialog.show();
      await element.updateComplete;
      const form = dialog.shadowRoot?.querySelector('form')!;
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await element.updateComplete;
      expect(element.treeUI.tree).to.not.have.property('TestDO');
    });
  });
});
