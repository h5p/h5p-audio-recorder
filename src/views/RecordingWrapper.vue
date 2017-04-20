<template>
  <div class="h5p-audio-recorder-view">
    <div class="icon-microphone"></div>
    <h2>Q: {{ title }}</h2>
    <div class="status-bar" v-bind:class="state">{{statusMessages[state]}}</div>

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
  .h5p-audio-recorder-view .status-bar {
    background-color: #f8f8f8;
  }
  .h5p-audio-recorder-view .status-bar.error {
    background-color: #db8b8b;
  }
</style>
