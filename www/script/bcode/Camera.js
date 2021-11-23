const state = {
    video: null,
    codeReader: null
};



class Camera{


    constructor(){

    }


    async getMonitorSource(src='monitor',light=false){
        if(state.video) return state.video;

        if(src === 'monitor'){
            state.video = await navigator.mediaDevices.getDisplayMedia();
        }
        else{
            state.video = await navigator.mediaDevices.getUserMedia({
                audio:false,
                video: {
                    facingMode: 'environment'
                  }
            });
            if(light){
                state.video.getVideoTracks()[0].applyConstraints({advanced:[{torch:true}]});
            }
        }
        return state.video;
    }


    StopVideo(){
        state.codeReader.stopContinuousDecode();
        for(let track of state.video.getTracks()){
            track.stop();
        }
        state.watcherresolver(true);
        state.watcher = null;
    }
}
