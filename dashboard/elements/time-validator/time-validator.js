class TimeValidator extends Polymer.mixinBehaviors([Polymer.IronValidatorBehavior], Polymer.Element) {
	static get is() {
		return 'time-validator';
	}

	static get properties() {
		return {

		};
	}

	validate(value) {
		// This regex validates incomplete times (by design)
		return !value || value.match(/^[0-9]{0,2}:[0-9]{0,2}$/);
	}
}

customElements.define(TimeValidator.is, TimeValidator);
