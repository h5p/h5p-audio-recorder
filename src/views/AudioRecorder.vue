<template>
  <div class="h5p-audio-recorder-view">
    <div v-bind:class="['recording-indicator-wrapper', {'background-enabled pulse' : state=='recording'}]"></div>
    <div class="fa-microphone"></div>
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
      <div class="button-row-double">
        <button class="button record"
                v-if="state === 'ready' || state === 'error'"
                v-on:click="record">
          <span class="fa-circle"></span>
          {{ l10n.recordAnswer }}
        </button>
      </div>

      <span class="button-row-left">
        <button class="button pause"
                  v-if="state === 'recording'"
                  v-on:click="pause">
          <span class="fa-pause"></span>
          {{ l10n.pause }}
        </button>
        <button class="button record"
                v-if="state === 'paused'"
                v-on:click="record">
          <span class="fa-circle"></span>
          {{ l10n.continue }}
        </button>
        <a class="button download"
                v-if="state === 'finished'"
                v-bind:href="audioSrc"
                v-bind:download="audioFilename">
          <span class="fa-download"></span>
          {{ l10n.download }}
        </a>
      </span>

      <span class="button-row-right">
        <button class="button finish"
                v-if="state === 'recording' || state === 'paused'"
                v-on:click="finish">
          <span class="fa-stop"></span>
          {{ l10n.finish }}
        </button>
        <button class="button retry"
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
  import State from '../components/State';

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
        const dialog = new H5P.ConfirmationDialog(
          {
            headerText: this.l10n.retryDialogHeaderText,
            dialogText: this.l10n.retryDialogBodyText,
            cancelText: this.l10n.retryDialogCancelText,
            confirmText: this.l10n.retryDialogConfirmText
          }
        );
        dialog.appendTo(H5P.jQuery(".h5p-audio-recorder-view")[0]);
        dialog.show();
        dialog.on('confirmed', () => {
          this.state = State.READY;
          this.$emit('retry');
        });
      }
    }
  }
</script>

<style lang="scss">
  @import "~susy/sass/susy";

  $screen-small: 576px;

  .h5p-audio-recorder-view {
    padding: 1.750em;
    text-align: center;

    [class^="fa-"] {
      font-family: 'H5PFontAwesome4';
    }

    .recording-indicator-wrapper {
      height: 9.375em;
      width: 9.375em;
      margin-left: auto;
      margin-right: auto;
      line-height: 9.375em;
      color: #8e8e8e;
    }

    .background-enabled {
      background-image: url('../images/08-vu-meter.svg');
    }

    .fa-microphone {
      font-size: 3em;
      top: 12%;
      left: 44.26%;
      position: absolute;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: white;
    }

    .fa-microphone::before {
      top: 39%;
      left: 31%;
      position: absolute;
    }

    .h5p-audio-recorder-player {
      width: 100%;
      padding: 0 1em;
      box-sizing: border-box;
      height: 2em;
      margin-top: 1.25em;
    }

    .title {
      color: black;
      font-size: 1.875em;
      margin-bottom: 1em;
    }

    .title-label {
      color: #8f8f8f;
    }

    /* status bar */
    [role="status"] {
      background-color: #f8f8f8;
      color: #777777;
      font-size: 1.250em;
      padding: 1.250em;

      &.recording {
       background-color: #f9e5e6;
       color: #da5254;
      }

      &.finished {
        background-color: #e0f9e3;
        color:  #20603d;
      }

      &.error {
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
    }

    .button-row {
      @include container;

      .button-row-double {
        @include span(1 of 1);
      }

      .button-row-left {
        @include span(1 of 1);
        margin-bottom: 0.5em;
      }

      .button-row-right {
        @include span(1 of 1);
        margin-bottom: 0.5em;
      }

      @media (min-width: $screen-small) {
        .button-row-left {
          @include span(first 50% no-gutters);
          text-align: right;
        }

        .button-row-right {
          @include span(last 50% no-gutters);
          text-align: left;
        }
      }
    }

    @mixin button-filled($background-color, $color) {
      background-color: $background-color;
      color: $color;
      border-color: $background-color;

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

    @mixin blueGlow {
      outline: 0;
      box-shadow: 0.06em 0 0.6em 0.1em lighten(#0a78d1, 30%);
    }

    .button {
      font-size: 1.563em;
      padding: 0.708em 1.250em;
      border-radius: 1.375em;
      margin: 0 0.5em;
      border: 0;
      display: inline-block;
      cursor: pointer;

      [class^="fa-"] {
        margin-right: 0.4em;
      }

      &:focus {
        @include blueGlow
      }

      &.finish,
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
    }
  }

  .pulse {
  	animation-name: pulse_animation;
  	animation-duration: 3000ms;
  	animation-iteration-count: infinite;
  	animation-timing-function: linear;
  }

  @keyframes pulse_animation {
  	0%  { transform: scale(1); }
  	30% { transform: scale(1); }
  	40% { transform: scale(1.08); }
  	50% { transform: scale(1); }
  	60% { transform: scale(1); }
  	70% { transform: scale(1.05); }
  	80% { transform: scale(1); }
  	100% { transform: scale(1); }
  }
</style>
