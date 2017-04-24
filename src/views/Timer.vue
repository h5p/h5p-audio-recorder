<template>
  <div role="timer" class="audio-recorder-timer">{{secondsPassed | formatTime}}</div>
</template>

<script>
  const Timer = require('timer-machine');

  export default {
    props: ['stopped'],

    mounted: function() {
      setInterval(() => {
        this.secondsPassed = (this.timer.time() / 1000);
      }, 200);
    },

    data: () => ({
      timer: new Timer(),
      secondsPassed: 0
    }),

    filters: {
      formatTime: value => {
        const prependZero = num => (num < 10) ? `0${num}`: `${num}`;
        const totalSeconds = parseInt(value, 10);

        let minutes = prependZero(Math.floor(totalSeconds / 60));
        let seconds = prependZero(totalSeconds - (minutes * 60));

        return `${minutes}:${seconds}`;
      },
    },

    watch : {
      stopped : function (stopped) {
        this.timer[stopped ? 'stop' : 'start']();
      }
    }
  }
</script>

<style>
  .audio-recorder-timer {
    font-family: 'Open Sans', sans-serif;
    font-size: 2.5em;
    color: #8f8f8f;
    padding: 2.813rem 0;
  }
</style>