(function () {
	'use strict';

	const TIME_PER_DOLLAR = 0.03;
	const total = nodecg.Replicant('total');

	class GdqOmnibarTotal extends Polymer.Element {
		static get is() {
			return 'gdq-omnibar-total';
		}

		static get properties() {
			return {};
		}

		ready() {
			super.ready();
			Polymer.RenderStatus.beforeNextRender(this, () => {
				this.$.totalTextAmount.rawValue = 0;
				total.on('change', this._handleTotalChanged.bind(this));
			});
		}

		_handleTotalChanged(newVal) {
			if (!this._totalInitialized) {
				this._totalInitialized = true;
				this.$.totalTextAmount.rawValue = newVal.raw;
				this.$.totalTextAmount.textContent = this.formatRawValue(newVal.raw);
				return;
			}

			const delta = newVal.raw - this.$.totalTextAmount.rawValue;
			const duration = Math.min(delta * TIME_PER_DOLLAR, 3);
			TweenLite.to(this.$.totalTextAmount, duration, {
				rawValue: newVal.raw,
				ease: Power2.easeOut,
				onUpdate() {
					this.$.totalTextAmount.textContent = this.formatRawValue(this.$.totalTextAmount.rawValue);
				},
				callbackScope: this
			});
		}

		formatRawValue(rawValue) {
			return rawValue.toLocaleString('en-US', {
				maximumFractionDigits: 0
			}).replace(/1/ig, '\u00C0');
		}
	}

	customElements.define(GdqOmnibarTotal.is, GdqOmnibarTotal);
})();
