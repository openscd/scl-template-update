/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { MdOutlinedButton } from '@scopedelement/material-web/button/outlined-button.js';
import { MdOutlinedTextField } from '@scopedelement/material-web/textfield/MdOutlinedTextField.js';
import { MdList } from '@scopedelement/material-web/list/MdList.js';
import { MdListItem } from '@scopedelement/material-web/list/MdListItem.js';

export class LNodeTypeSidebar extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'md-outlined-button': MdOutlinedButton,
    'md-outlined-textfield': MdOutlinedTextField,
    'md-list': MdList,
    'md-list-item': MdListItem,
  };

  @property({ type: Array })
  lNodeTypes: Element[] = [];

  @property({ type: String })
  selectedId?: string;

  @state()
  filter: string = '';

  private debounceTimer?: number;

  private handleInput(e: Event) {
    const { value } = e.target as HTMLInputElement;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.filter = value;
    }, 300);
  }

  private clearFilter() {
    this.filter = '';
  }

  private handleClick(id: string) {
    this.dispatchEvent(
      new CustomEvent('lnodetype-select', {
        detail: { id },
        bubbles: true,
        composed: true,
      })
    );
  }

  private get filteredLNodeTypes(): Element[] {
    if (!this.filter.trim()) return this.lNodeTypes;
    // If the filter includes words separated by &, treat as a single AND group (e.g. 'a & b', 'a&b', 'a &b', 'a& b').
    // Otherwise, split on comma or space (unless adjacent to &), so 'a b' and 'a,b' are separate OR groups.
    let groups: string[][] = [];
    const filter = this.filter.toLowerCase().trim();
    if (/^\s*\w+\s*&\s*\w+\s*$/.test(filter)) {
      groups = [
        filter
          .replace(/\s*&\s*/g, '&')
          .split('&')
          .filter(Boolean),
      ];
    } else {
      groups = filter
        .split(/(?<!&)[ ,]+(?!&)/)
        .map(group =>
          group
            .replace(/\s*&\s*/g, '&')
            .split('&')
            .filter(Boolean)
        )
        .filter(group => group.length > 0);
    }

    if (groups.length === 0) return this.lNodeTypes;

    return this.lNodeTypes.filter(ln => {
      const id = ln.getAttribute('id')?.toLowerCase() || '';
      const desc = ln.getAttribute('desc')?.toLowerCase() || '';
      return groups.some(group =>
        group.every(term => id.includes(term) || desc.includes(term))
      );
    });
  }

  render() {
    return html`<div class="sidebar">
      <div class="sidebar-content">
        <div class="actions">
          <md-filled-button
            class="clear-all"
            @click=${this.clearFilter}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                this.clearFilter();
              }
            }}
          >
            Clear filter
          </md-filled-button>
        </div>
        <div class="search-filter">
          <div class="search-container">
            <md-outlined-textfield
              label="Filter Logical Node Types"
              type="text"
              placeholder="e.g.: TCTR, TVTR&amp;protection"
              .value=${this.filter}
              @input=${this.handleInput}
              aria-label="Filter Logical Node Types"
            ></md-outlined-textfield>
            <div class="helper-text">
              Search by ID or description. Use commas/spaces for OR, use & for
              AND.
            </div>
          </div>
        </div>
        <md-list>
          ${this.filteredLNodeTypes.map(ln => {
            const id = ln.getAttribute('id') || '';
            const desc = ln.getAttribute('desc') || '';
            const isSelected = this.selectedId === id;
            return html`
              <md-list-item
                type="button"
                ?selected=${isSelected}
                @click=${() => this.handleClick(id)}
              >
                <span slot="headline" title=${id}>${id}</span>
                <span slot="supporting-text">${desc}</span>
              </md-list-item>
            `;
          })}
        </md-list>
      </div>
    </div> `;
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated?.(changedProperties);
    // Scroll md-list to top when lNodeTypes changes
    if (changedProperties.has('lNodeTypes')) {
      const mdList = this.renderRoot.querySelector('md-list');
      if (mdList) mdList.scrollTop = 0;
    }
  }

  static styles = css`
    .sidebar {
    }
    .sidebar-content {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      padding: 1rem;
      overflow: hidden;
      background-color: #fcf6e5;
    }
    md-list {
      min-height: 0;
      max-height: 65vh;
      overflow-y: auto;
      scrollbar-width: thin;
      padding: 0;
    }
    md-list::-webkit-scrollbar {
      width: 8px;
    }
    md-list::-webkit-scrollbar-thumb {
      border-radius: 4px;
    }
    md-list::-webkit-scrollbar-track {
      background: transparent;
    }
    md-list-item {
      box-sizing: border-box;
    }
    md-list-item[selected] {
      background: var(--md-sys-color-primary);
    }
    md-list-item[selected] span[slot='headline'],
    md-list-item[selected] span[slot='supporting-text'] {
      color: var(--md-sys-color-on-primary, #ffffff);
    }
    md-outlined-textfield {
      width: 100%;
    }
    .actions {
      display: flex;
      flex-direction: row-reverse;
      margin-bottom: 0.5rem;
    }
    .search-filter {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .search-container {
      flex: 1;
      position: relative;
    }
    .helper-text {
      font-size: 0.85em;
      color: #888;
      margin-top: 0.2em;
    }
    .clear-all {
      cursor: pointer;
      color: var(--md-sys-color-primary, #0078d4);
      text-decoration: underline;
      font-size: 0.95em;
    }
  `;
}
