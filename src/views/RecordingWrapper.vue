<template>
  <div class="h5p-audio-recorder-view">
    <div class="recording-indicator">
      <div class="fa-microphone"></div>
    </div>

    <div class="title"><span class="title-label">Q:</span> {{ title }}</div>
    <div class="status-bar" v-bind:class="state">{{statusMessages[state]}}</div>

    <div class="recording-counter">00:00</div>

    <button class="button button-record" v-if="state === 'ready'" v-on:click="record">Record Answer</button>
    <button class="button button-pause" v-if="state === 'recording'" v-on:click="pause">Pause</button>
    <button class="button button-continue" v-if="state === 'paused'" v-on:click="record">Continue</button>
    <button class="button button-finish" v-if="state === 'recording' || state === 'paused'" v-on:click="finish">Finish</button>

    <div class="button-row">
      <button class="button button-record" v-if="state === 'ready' || state === 'error'"
              v-on:click="record">
        Record Answer
      </button>
      <button class="button button-pause" v-if="state === 'recording'" v-on:click="pause">
        Pause
      </button>
      <button class="button button-continue" v-if="state === 'paused'" v-on:click="record">
        Continue
      </button>
      <button class="button button-finish" v-if="state === 'recording' || state === 'paused'"
              v-on:click="finish">
        Finish
      </button>

      <button class="button button-download" v-if="state === 'finished'" v-on:click="download">
        Download
      </button>
      <button class="button button-retry" v-if="state === 'finished'" v-on:click="retry">Retry</button>

      <button v-on:click="record" class="button red" v-if="state === 'ready'"><span class="fa-circle"></span> Record Answer</button>
      <button v-on:click="pause" class="button inverse red" v-if="state === 'recording'"><span class="fa-pause"></span> Pause</button>
      <button v-on:click="record" class="button red" v-if="state === 'paused'"><span class="fa-circle"></span> Continue</button>
    <button v-on:click="finish"class="button " v-if="state === 'recording' || state === 'paused'"><span class="fa-stop"></span> Finish</button>
      <button v-on:click="download" class="button green" v-if="state === 'finished'"><span class="fa-download"></span> Download</button>
      <button v-on:click="retry"class="button" v-if="state === 'finished'"><span class="fa-undo"></span>Retry</button></div>
  </div>
</template>

<script>
  const State = {
    READY: 'ready',
    RECORDING: 'recording',
    PAUSED: 'paused',
    FINISHED: 'finished',
    ERROR: 'error'
  };

  export default {
    data: {
      title: '',
      state: State.READY
    },

    methods: {
      record: function() {
        this.$emit(State.RECORDING);
      },

      pause: function() {
        this.state = State.PAUSED;
        console.debug('paused');
      },

      finish: function() {
        this.state = State.FINISHED;
        console.debug('finished');
      },

      retry: function(){
        console.debug('retry');
        // TODO Clear existing recording

        this.record();
      },

      download: function(){
        console.debug('TODO: Initialize download');
      }
    }
  }
</script>

<style>
  .h5p-audio-recorder-view {
    padding: 1.750em;
    text-align: center;
  }

  .h5p-audio-recorder-view [class^="fa-"] {
    font-family: 'H5PFontAwesome4';
  }

  .h5p-audio-recorder-view .recording-indicator {
    height: 9.375em;
    width: 9.375em;
    margin-left: auto;
    margin-right: auto;
    line-height: 9.375em;
    background-image: url('../images/08-vu-meter.svg');
    color: #8e8e8e;
  }

  .h5p-audio-recorder-view .recording-indicator .fa-microphone {
    font-size: 3em;
    background-color: white;
  }


  .h5p-audio-recorder-view .title {
    color: black;
    font-size: 1.875em;
    margin-bottom: 1em;
  }

  .h5p-audio-recorder-view .title-label {
    color: #8f8f8f;
  }

  /* status bar */
  .h5p-audio-recorder-view .status-bar {
    background-color: #f8f8f8;
    color: #777777;
    font-size: 1.250em;
    line-height: 3.750em;
    padding: 0 1em;
  }

  .h5p-audio-recorder-view .status-bar.recording {
    background-color: #f9e5e6;
    color: #da5254;
  }

  .h5p-audio-recorder-view .status-bar.finished {
    background-color: #e0f9e3;
    color:  #20603d;
  }

  .h5p-audio-recorder-view .recording-counter {
    font-size: 2.5em;
    color: #8f8f8f;
    padding: 2.813rem 0;
  }

  .button {
    font-size: 1.563em;
    padding: 0.708em 1.250em;
    border-radius: 1.375em;
    margin: 0 0.5em;
    border: 0;
    display: inline-block;
    cursor: pointer;
    background-color: #5e5e5e;
    color: white;
  }

  .button [class^="fa-"] {
    margin-right: 0.4em;
  }

  .button.red {
    background-color: #d95354;
  }

  .button.inverse.red {
    background-color: white;
    border: 2px solid #d95354;
    color: #d95354;
  }

  .button.green {
    background-color: #1f824c;
  }
  .h5p-audio-recorder-view .status-bar.error {
    background-color: #db8b8b;
  }
</style>
