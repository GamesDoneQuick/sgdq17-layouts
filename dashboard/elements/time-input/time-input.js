class TimeInput extends Polymer.mixinBehaviors([Polymer.IronValidatableBehavior], Polymer.Element) {
	static get is() {
		return 'time-input';
	}

	static get properties() {
		return {
			value: {
				notify: true,
				type: String
			},

			_minutes: {
				type: Number
			},

			_seconds: {
				type: Number
			},

			validator: {
				type: String,
				value: 'time-validator'
			}
		};
	}

	static get observers() {
		return [
			'_computeValue(_minutes,_seconds)'
		];
	}

	setMS(m, s) {
		this._minutes = m < 10 ? `0${m}` : m;
		this._seconds = s < 10 ? `0${s}` : s;
	}

	_computeValue(minutes, seconds) {
		this.value = `${minutes}:${seconds}`;
	}
}

customElements.define(TimeInput.is, TimeInput);
