export {
	psThing as default,
	psThing
};


/**
 * Things are a base class
 *
 * The primary extra features are that it extends from `EventTarget`,
 * but also contains an event emitter for changes that buffers the events
 * to avoid overwhelming the system.
 */
class psThing extends HTMLElement{
	constructor(opts = {}) {
		super();
		// set the default values
		this._ = {
			changes: {
				props: new Set(),
				rate: 23 /*skidoo*/,
				emitting: null
			}
		};
		// overlay any options passed in
		this._ = Object.assign(this._, opts);
	}

	/**
	 * Emit a change event for the given property.
	 *
	 * Change events only get emitted every 23 milliseconds to prevent
	 * overloading the system. The event sends a list of the properties
	 * that have been changed.
	 *
	 * @param {string} prop The property that has changed
	 */
	emitChange(prop){
		let changes = this._.changes;
		changes.props.add(prop);
		if(changes.emitting) return;

		changes.emitting = setTimeout(()=>{
			changes.emitting = false;
			this.emit('change',Array.from(changes.props.values()));
			changes.props.clear();
		},changes.rate);
	}

	/**
	 * Emits an event
	 *
	 * Pure helper becuase dispatching events is verbose
	 *
	 * @param {string} name
	 * @param {*} detail value to be attached to the event
	 */
	emit(name,detail){
		let event = new CustomEvent(name, {
			detail: detail
		});
		this.dispatchEvent(event);
	}


}
