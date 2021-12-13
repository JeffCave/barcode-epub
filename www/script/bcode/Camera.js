export {
	Camera as default,
	Camera
};


/**
 * A simple controller for the video feeds, based aournd the camera
 */
class Camera extends EventTarget{

	constructor(opts){
		super();
		this.p = Object.assign({
			light: false,
			src: 'monitor',
		},opts);
		this.p.stream = null;
	}

	get stream(){
		return this.p.stream;
	}


	get light(){
		return this.p.light;
	}
	set light(state){
		state = !!state;
		if(this.p.light === state) return;
		this.p.light = state;
		this.video.getVideoTracks()[0].applyConstraints({advanced:[{torch:state}]});
		this.dispatchEvent(new CustomEvent( 'light',{detail:state}));
	}


	async setMonitorSource(src=this.p.src){
		//verify that the value is of the correct type
		src = src || '';
		src = src.toString().toLocaleLowerCase();
		if(!['monitor','camera'].includes(src)) throw new RangeError('src is invalid value. Allowed [monitor,camera]');
		// if it is different than the last selection, stop the last one
		if(src !== this.p.src) this.StopVideo();
		// if we already have a running stream, just give them that one
		if(this.p.stream) return this.p.stream;


		if(src === 'monitor'){
			this.p.stream = await navigator.mediaDevices.getDisplayMedia();
		}
		else{
			this.p.stream = await navigator.mediaDevices.getUserMedia({
				audio:false,
				video: {
					facingMode: 'environment'
				}
			});
			this.light = !this.light;
			this.light = !this.light;
		}
		this.dispatchEvent(new CustomEvent( 'play' , {detail: this.p.stream} ));

		return this.p.stream;
	}


	StopVideo(){
		this.light = false;
		if(this.video){
			for(let track of this.video.getTracks()){
				track.stop();
			}
		}
		this.video = null;
		this.dispatchEvent(new CustomEvent( 'pause'));
	}
}
