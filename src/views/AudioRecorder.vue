<template>
  <div class="h5p-audio-recorder-view">
    <vuMeter :avgMicFrequency="avgMicFrequency" :enablePulse="state === 'recording'"></vuMeter>

    <div v-if="state !== 'done'  && title" class="title" v-html="title" />

    <div role="status" v-bind:class="state" v-html="statusMessages[state]" />

    <div class="h5p-audio-recorder-player" v-if="state === 'done' && audioSrc !== ''">
      <audio controls="controls">
        Your browser does not support the <code>audio</code> element.
        <source v-bind:src="audioSrc">
      </audio>
    </div>

    <timer ref="timer" v-bind:stopped="state !== 'recording'" v-if="state !== 'unsupported' && state !== 'done' && state !== 'insecure-not-allowed'"></timer>

    <div v-if="state !== 'blocked' && state !== 'unsupported' && state === 'done'" class="h5p-audio-recorder-download">
      {{ l10n.downloadRecording }}
    </div>

    <div class="button-row">
      <div class="button-row-double">
        <button class="button record"
                v-if="state === 'ready' || state === 'blocked'"
                ref="button-record"
                v-on:click="record">
          <span class="fa-circle"></span>
          {{ l10n.recordAnswer }}
        </button>

        <button class="button retry small"
                v-if="state === 'recording' || state === 'paused'"
                v-bind:class="{ 'small-screen' : this.viewState === 'small' }"
                v-on:click="retry">
          <span class="fa-undo"></span>
          <span class="label">{{ l10n.retry }}</span>
        </button>
        <button class="button pause"
                v-bind:class="{ 'small-screen' : this.viewState === 'small' }"
                ref="button-pause"
                v-if="state === 'recording'"
                v-on:click="pause">
          <span class="fa-pause"></span>
          <span class="label">{{ l10n.pause }}</span>
        </button>
        <button class="button record"
                v-bind:class="{ 'small-screen' : this.viewState === 'small' }"
                ref="button-continue"
                v-if="state === 'paused'"
                v-on:click="record">
          <span class="fa-circle"></span>
          <span class="label">{{ l10n.continue }}</span>
        </button>
        <button class="button done small"
                v-bind:class="{ 'small-screen' : this.viewState === 'small' }"
                v-if="state === 'recording' || state === 'paused'"
                v-on:click="done">
          <span class="fa-play-circle"></span>
          <span class="label">{{ l10n.done }}</span>
        </button>
      </div>

      <span class="button-row-left">
        <a class="button download"
           ref="button-download"
           v-if="state === 'done'"
           v-bind:href="audioSrc"
           v-bind:download="audioFilename">
          <span class="icon-download"></span>
          {{ l10n.download }}
        </a>
      </span>

      <span class="button-row-right">
        <button class="button retry"
                v-if="state === 'done' || state === 'cant-create-audio-file'"
                v-on:click="retry">
          <span class="fa-undo"></span>
          <span class="label">{{ l10n.retry }}</span>
        </button>
      </span>
    </div>
  </div>
</template>

<script>
  import State from '../components/State';

  // focus on ref when state is changed
  const refToFocusOnStateChange = {};
  refToFocusOnStateChange[State.READY] = 'button-record';
  refToFocusOnStateChange[State.RECORDING] = 'button-pause';
  refToFocusOnStateChange[State.PAUSED] = 'button-continue';
  refToFocusOnStateChange[State.DONE] = 'button-download';

  const viewStateBreakPoint = 576; // px, container width to toggle viewState at

  export default {
    methods: {
      // Resize buttons. Not using media queries to allow being subcontent
      resize: function() {
        if (!this.$el) {
          return; // Not attached yet
        }

        this.viewState = (this.$el.offsetWidth <= viewStateBreakPoint) ? 'small' : 'large';
      },

      record: function() {
        this.$emit(State.RECORDING);
      },

      pause: function() {
        this.state = State.PAUSED;
        this.$emit(this.state);
      },

      done: function() {
        this.state = State.DONE;
        this.$emit(State.DONE);
      },

      retry: function() {
        let dialogParent = this.$el;

        /*
         * If AudioRecorder is subcontent, the dialog may be hidden behind
         * other elements if it is not attached to the h5p-content element
         */
        if (this.isSubcontent) {
          const findH5PContent = function(element) {
            if (!element) {
              return null;
            }
            else if (element.className.indexOf('h5p-content') !== -1) {
              return element;
            }
            else {
              return findH5PContent(element.parentNode);
            }
          }

          dialogParent = findH5PContent(this.$el) || this.$el;
        }

        const dialog = new H5P.ConfirmationDialog(
          {
            headerText: this.l10n.retryDialogHeaderText,
            dialogText: this.l10n.retryDialogBodyText,
            cancelText: this.l10n.retryDialogCancelText,
            confirmText: this.l10n.retryDialogConfirmText
          }
        );
        dialog.appendTo(dialogParent);
        dialog.show();
        dialog.on('confirmed', () => {
          this.state = State.READY;
          if(this.$refs.timer) {
            this.$refs.timer.reset();
          }
          this.$emit('retry');
        });
      }
    },

    filters: {
      unEscape: function(str) {
        return str.replace(/&#039;/g, '\'');
      },
    },

    watch: {
      state: function(state){
        if(refToFocusOnStateChange[state]) {
          this.$nextTick(() => this.$refs[refToFocusOnStateChange[state]].focus());
        }
      }
    }
  }
</script>

<style lang="scss" type="text/scss">
  $record-button-width: 8.2em;

  @mixin blueGlow {
    outline: 0;
    box-shadow: 0.06em 0 0.6em 0.1em lighten(#0a78d1, 30%);
  }

  .h5p-content:not(.using-mouse) .h5p-audio-recorder-view .button:focus {
    @include blueGlow
  }

  .h5p-audio-recorder-view {
    font-size: 1em;
    padding: 0.9em;
    text-align: center;
    font-family: Arial, 'Open Sans', sans-serif;

    [class^="fa-"] {
      font-family: 'H5PFontAwesome4';
    }

    .fa-microphone {
      width: 60%;
      height: 60%;
      left: 50%;
      top: 50%;
      transform: translate(-50%,-50%);
      position: absolute;
      font-size: 2.5em;
      border-radius: 50%;
      background-color: white;
      line-height: 2.5em;
    }

    .h5p-audio-recorder-player {
      box-sizing: border-box;
      margin: 1.25em 1em 0 1em;

      audio {
        width: 100%;
      }
    }

    .title {
      color: black;
      font-size: 1.250em;
      margin-bottom: 1em;
      line-height: 1.5em;
    }

    .icon-download {
      &:before {
        font-family: 'H5PFontIcons';
        content: '\e918';
      }
    }

    /* status bar */
    [role="status"] {
      background-color: #f8f8f8;
      color: #777777;
      padding: 0.6em;

      &.recording {
       background-color: #f9e5e6;
       color: #da5254;
      }

      &.done {
        background-color: #e0f9e3;
        color:  #20603d;
      }

      &.blocked,
      &.unsupported,
      &.insecure-not-allowed,
      &.cant-create-audio-file {
        background-color: #db8b8b;
        color: black;
      }
    }

    .h5p-audio-recorder-download {
      font-size: 1.2em;
      padding: 2em;
    }

    .h5p-confirmation-dialog-popup {
      top: 5em;
      width: 35em;
      max-width: 100%;
      min-width: 0;
    }

    .button-row {
      margin-bottom: 1em;

      .button-row-double {
        width: 100%;
      }

      .button-row-left {
        text-align: right;
        flex: 1;
      }

      .button-row-right {
        text-align: left;
        flex: 1;
      }
    }

    @mixin button-filled($background-color, $color) {
      background-color: $background-color;
      color: $color;
      border-color: $background-color;
      border: 2px solid $background-color;
      box-sizing: border-box;

      &:hover {
        background-color: darken($background-color, 5%);
        border-color: darken($background-color, 5%);
      }

      &:active {
        background-color: darken($background-color, 10%);
        border-color: darken($background-color, 10%);
      }

      &[disabled] {
        background-color: lighten($background-color, 40%);
        border-color: lighten($background-color, 40%);
      }
    }

    @mixin button-inverse($background-color, $color) {
      background-color: $background-color;
      color: $color;
      border: 2px solid $color;
      box-sizing: border-box;

      &:hover {
        color: lighten($color, 10%);
        border-color: lighten($color, 10%);
      }

      &:active {
        color: darken($color, 10%);
        border-color: darken($color, 10%);
      }

      &[disabled],
      &[aria-disabled] {
        color: lighten($color, 40%);
        border-color: lighten($color, 40%);
      }
    }

    .button {
      font-size: 1.042em;
      font-family: 'Open Sans', sans-serif;
      padding: 0.708em 1.250em;
      border-radius: 2em;
      margin: 0 0.5em;
      border: 0;
      display: inline-block;
      cursor: pointer;
      text-decoration: none;
      font-weight: 600;
      white-space: nowrap;

      [class^="fa-"] {
        font-weight: 400;
      }

      &.small {
        font-size: 0.85em;
      }

      &.done {
        @include button-inverse(white, #1f824c);
      }

      &.retry {
        @include button-filled(#5e5e5e, white);
      }

      &.record {
        @include button-filled(#d95354, white);
      }

      &.download {
        @include button-filled(#1f824c, white);
      }

      &.pause {
        @include button-inverse(white, #d95354);
      }

      &.small-screen {
        .label {
          display: none;
        }
      }

      &:not(.small-screen) {
        [class^="fa-"] {
          margin-right: 0.4em;
        }

        &.record,
        &.pause {
          min-width: $record-button-width;
        }
      }
    }
  }
</style>
