<template>
  <div class="h5p-audio-recorder-view">
    <div class="icon-microphone"></div>
    <div class="title">Q: {{ title }}</div>
    <div class="status-bar" v-bind:class="state">{{statusMessages[state]}}</div>

    <div class="button-row">
      <button v-on:click="record" class="button red" v-if="state === 'ready'">Record Answer</button>
      <button v-on:click="pause" class="button inverse red" v-if="state === 'recording'">Pause</button>
      <button v-on:click="record" class="button red" v-if="state === 'paused'">Continue</button>
      <button v-on:click="finish" class="button" v-if="state === 'recording' || state === 'paused'">Finish</button>
      <button v-on:click="download" class="button green" v-if="state === 'finished'">Download</button>
      <button v-on:click="retry" class="button" v-if="state === 'finished'">Retry</button>
    </div>

  </div>
</template>

<script>
  const State = {
    READY: 'ready',
    RECORDING: 'recording',
    PAUSED: 'paused',
    FINISHED: 'finished'
  };

  export default {
    data: {
      title: '',
      state: State.READY
    },

    methods: {
      record: function() {
        this.state = State.RECORDING;
        console.debug('recording');
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
  .h5p-audio-recorder-view .title {
    color: black;
    font-size: 1.875em;
    text-align: center;
  }

  /* status bar */
  .h5p-audio-recorder-view .status-bar {
    background-color: #f8f8f8;
    color: #777777;
    font-size: 1.250em;
    line-height: 3.750em;
    text-align: center;
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

  .button-row {
    text-align: center;
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

  .button.red {
    background-color: #d95354;
  }

  .button.red.inverse {
    background-color: white;
    border: 2px solid #d95354;
    color: #d95354;
  }

  .button.green {
    background-color: #1f824c;
  }
</style>
