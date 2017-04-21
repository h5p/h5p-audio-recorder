<template>
  <div class="h5p-audio-recorder-view">
    <div class="recording-indicator">
      <div class="fa-microphone"></div>
    </div>
    <div v-if="state !== 'finished'" class="title">
      <span class="title-label">Q:</span>
      {{ title }}
    </div>
    <div role="status" v-bind:class="state">{{statusMessages[state]}}</div>

    <audio class="h5p-audio-recorder-player" v-if="state === 'finished' && audioSrc !== ''"
           controls="controls">
      Your browser does not support the <code>audio</code> element.
      <source v-bind:src="audioSrc">
    </audio>

    <timer v-bind:stopped="state !== 'recording'" v-if="state !== 'finished'"></timer>

    <div v-else class="h5p-audio-recorder-download">
      {{ l10n.downloadRecording }}
    </div>

    <div class="button-row">
      <button class="button red"
              v-if="state === 'ready' || state === 'error'"
              v-on:click="record">
        <span class="fa-circle"></span>
        {{ l10n.recordAnswer }}
      </button>

      <span class="button-row-left">
        <button class="button inverse red"
                  v-if="state === 'recording'"
                  v-on:click="pause">
          <span class="fa-pause"></span>
          {{ l10n.pause }}
        </button>
        <button class="button red"
                v-if="state === 'paused'"
                v-on:click="record">
          <span class="fa-circle"></span>
          {{ l10n.continue }}
        </button>
        <a class="button green"
                v-if="state === 'finished'"
                v-bind:href="audioSrc"
                v-bind:download="audioFilename">
          <span class="fa-download"></span>
          {{ l10n.download }}
        </a>
      </span>

      <span class="button-row-right">
        <button class="button"
                v-if="state === 'recording' || state === 'paused'"
                v-on:click="finish">
          <span class="fa-stop"></span>
          {{ l10n.finish }}
        </button>
        <button class="button"
                v-if="state === 'finished'"
                v-on:click="retry">
          <span class="fa-undo"></span>
          {{ l10n.retry }}
        </button>
      </span>
    </div>
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
    methods: {
      record: function() {
        this.$emit(State.RECORDING);
      },

      pause: function() {
        this.state = State.PAUSED;
        this.$emit(this.state);
      },

      finish: function() {
        this.state = State.FINISHED;
        this.$emit(State.FINISHED);
      },

      retry: function(){
        // TODO Clear existing recording
        var dialog = new H5P.ConfirmationDialog(
          {
            headerText: this.l10n.retryDialogHeaderText,
            dialogText: this.l10n.retryDialogBodyText,
            cancelText: this.l10n.retryDialogCancelText,
            confirmText: this.l10n.retryDialogConfirmText
          }
        );
        dialog.appendTo(H5P.jQuery(".h5p-audio-recorder-view")[0]);
        dialog.show();
        var self = this;
        dialog.on('confirmed', function () {
          self.state = State.READY;
          self.$emit('retry');
        });
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

  .h5p-audio-recorder-player {
    width: 100%;
    padding: 0 1em;
    box-sizing: border-box;
    height: 2em;
    margin-top: 1.25em;
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
  .h5p-audio-recorder-view [role="status"] {
    background-color: #f8f8f8;
    color: #777777;
    font-size: 1.250em;
    line-height: 3.750em;
    padding: 0 1em;
  }

  .h5p-audio-recorder-view [role="status"].recording {
    background-color: #f9e5e6;
    color: #da5254;
  }

  .h5p-audio-recorder-view [role="status"].finished {
    background-color: #e0f9e3;
    color:  #20603d;
  }

  .h5p-audio-recorder-view [role="status"].error {
    background-color: #db8b8b;
    color: black;
  }

  .h5p-audio-recorder-download {
    font-size: 1.2em;
    padding: 2em;
  }

  .h5p-audio-recorder-view .h5p-confirmation-dialog-popup {
    top: 5em;
  }

  .button-row {
    overflow: hidden;
  }

  .button-row .button-row-left {
    width: 50%;
    float: left;
    text-align: right;
  }

  .button-row .button-row-right {
    width: 50%;
    float: left;
    text-align: left;
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
    text-decoration: none;
    text-align: center;
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
</style>
