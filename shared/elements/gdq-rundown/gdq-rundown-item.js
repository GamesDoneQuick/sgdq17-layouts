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
		this.$.right.innerHTML = '';
		switch (item.type) {
			case 'run':
				this.name = item.name;
				this.$.right.innerHTML = item.category;
				break;
			case 'adBreak':
				this.name = 'Ad Break';
				item.ads.forEach(ad => {
					const span = document.createElement('span');
					span.textContent = `${ad.adType} - ${ad.filename}`;
					this.$.right.appendChild(span);
				});
				break;
			case 'interview':
				this.name = `INTERVIEW - ${item.subject}`;
				item.interviewers.forEach(interviewer => {
					const span = document.createElement('span');
					span.textContent = `${interviewer}, `;
					span.classList.add('interviewer');
					this.$.right.appendChild(span);
				});
				item.interviewees.forEach(interviewees => {
					const span = document.createElement('span');
					span.textContent = `${interviewees}, `;
					this.$.right.appendChild(span);
				});
				this.$.right.lastChild.textContent =
					this.$.right.lastChild.textContent.substr(0, this.$.right.lastChild.textContent.length - 2);
				break;
			default:
				throw new Error(`'Unexpected content type: ${item.type}`);
		}
	}
}

customElements.define(GdqRundownItem.is, GdqRundownItem);
