class GdqRundownItem extends Polymer.Element {
	static get is() {
		return 'gdq-rundown-item';
	}

	static get properties() {
		return {
			item: {
				type: Object,
				observer: '_itemChanged'
			},
			itemType: {
				type: String,
				reflectToAttribute: true,
				readOnly: true
			},
			current: {
				type: Boolean,
				reflectToAttribute: true
			}
		};
	}

	_itemChanged(item) {
		this._setItemType(item ? item.type : '');
		switch (item.type) {
			case 'run':
				this.name = item.name;
				this.$.right.innerHTML = item.category;
				break;
			case 'adBreak':
				this.name = 'Ad Break';
				this.$.right.innerHTML = '';
				item.ads.forEach(ad => {
					const span = document.createElement('span');
					span.textContent = `${ad.adType} - ${ad.filename}`;
					this.$.right.appendChild(span);
				});
				break;
			case 'interview':
				this.name = `INTERVIEW - ${item.subject}`;
				break;
			default:
				throw new Error(`'Unexpected content type: ${item.type}`);
		}
	}
}

customElements.define(GdqRundownItem.is, GdqRundownItem);
