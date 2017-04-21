export default function recorderWorker() {
  var recLength = 0,
    recBuffers = [],
    sampleRate,
    numChannels,
    mp3codec;

  this.onmessage = function(e){
    switch(e.data.command){
      case 'init':
        init(e.data.config);
        break;
      case 'record':
        record(e.data.buffer);
        break;
      case 'export-wav':
        exportWAV(true);
        break;
      case 'export-mp3':
        exportMP3();
        break;
      case 'get-buffer':
        getBuffer();
        break;
      case 'clear':
        clear();
        break;
    }
  };

  function init(config){
    try {
      this.importScripts(config.lameScriptURL);
    }
    catch(e) {
      console.log(e);
    }
    sampleRate = config.sampleRate;
    numChannels = config.numChannels;
    initBuffers();
  }

  function mp3Init(config) {
    config = config || {};

    mp3codec = Lame.init();

		Lame.set_mode(mp3codec, config.mode || Lame.JOINT_STEREO);
		Lame.set_num_channels(mp3codec, config.channels || 2);
		Lame.set_num_samples(mp3codec, config.samples || -1);
		Lame.set_in_samplerate(mp3codec, config.samplerate || 44100);
		Lame.set_out_samplerate(mp3codec, config.samplerate || 44100);
		Lame.set_bitrate(mp3codec, config.bitrate || 128);

		Lame.init_params(mp3codec);
  }

  function parseWav(wav) {
		function readInt(i, bytes) {
			var ret = 0,
				shft = 0;

			while (bytes) {
				ret += wav[i] << shft;
				shft += 8;
				i++;
				bytes--;
			}
			return ret;
		}
		if (readInt(20, 2) != 1) throw 'Invalid compression code, not PCM';
		if (readInt(22, 2) != 1) throw 'Invalid number of channels, not 1';
		return {
			sampleRate: readInt(24, 4),
			bitsPerSample: readInt(34, 2),
			samples: wav.subarray(44)
		};
	}

  function record(inputBuffer){
    for (var channel = 0; channel < numChannels; channel++){
      recBuffers[channel].push(inputBuffer[channel]);
    }
    recLength += inputBuffer[0].length;
  }

  function exportMP3() {
    var self = this;
    var blob = exportWAV();
	  var fileReader = new FileReader();

    fileReader.onload = function () {
      var arrayBuffer = this.result;
		  var buffer = new Uint8Array(arrayBuffer),
      data = parseWav(buffer);

      mp3Init({
        mode : 3,
  			channels: numChannels,
  			samplerate: data.sampleRate,
  			bitrate: data.bitsPerSample
      });

      var buffer = Uint8ArrayToFloat32Array(data.samples);
      var mp3data = Lame.encode_buffer_ieee_float(mp3codec, buffer, buffer);
      var audioBlob = new Blob([new Uint8Array(mp3data.data)], {type: 'audio/mp3'});

      self.postMessage({
        command: 'mp3-delivered',
        blob: audioBlob
      });
    };

    fileReader.readAsArrayBuffer(blob);
  }

  function Uint8ArrayToFloat32Array(u8a){
    var f32Buffer = new Float32Array(u8a.length);
    for (var i = 0; i < u8a.length; i++) {
      var value = u8a[i<<1] + (u8a[(i<<1)+1]<<8);
      if (value >= 0x8000) value |= ~0x7FFF;
      f32Buffer[i] = value / 0x8000;
    }
    return f32Buffer;
  }

  function exportWAV(postMessage){
    var buffers = [];
    for (var channel = 0; channel < numChannels; channel++){
      buffers.push(mergeBuffers(recBuffers[channel], recLength));
    }
    if (numChannels === 2){
        var interleaved = interleave(buffers[0], buffers[1]);
    } else {
        var interleaved = buffers[0];
    }
    var dataview = encodeWAV(interleaved);
    var audioBlob = new Blob([dataview], { type: 'audio/wav' });

    if (postMessage) {
      this.postMessage({
        command: 'wav-delivered',
        blob: audioBlob
      });
    }

    return audioBlob
  }

  function getBuffer(){
    var buffers = [];
    for (var channel = 0; channel < numChannels; channel++){
      buffers.push(mergeBuffers(recBuffers[channel], recLength));
    }
    this.postMessage(buffers);
  }

  function clear(){
    recLength = 0;
    recBuffers = [];
    initBuffers();
  }

  function initBuffers(){
    for (var channel = 0; channel < numChannels; channel++){
      recBuffers[channel] = [];
    }
  }

  function mergeBuffers(recBuffers, recLength){
    var result = new Float32Array(recLength);
    var offset = 0;
    for (var i = 0; i < recBuffers.length; i++){
      result.set(recBuffers[i], offset);
      offset += recBuffers[i].length;
    }
    return result;
  }

  function interleave(inputL, inputR){
    var length = inputL.length + inputR.length;
    var result = new Float32Array(length);

    var index = 0,
      inputIndex = 0;

    while (index < length){
      result[index++] = inputL[inputIndex];
      result[index++] = inputR[inputIndex];
      inputIndex++;
    }
    return result;
  }

  function floatTo16BitPCM(output, offset, input){
    for (var i = 0; i < input.length; i++, offset+=2){
      var s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }

  function writeString(view, offset, string){
    for (var i = 0; i < string.length; i++){
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  function encodeWAV(samples){
    var buffer = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 2 * numChannels, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, numChannels * 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(view, 44, samples);

    return view;
  }
}
