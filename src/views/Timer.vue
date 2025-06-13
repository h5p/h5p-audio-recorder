<template>
  <div role="timer" class="audio-recorder-timer">{{formatTime}}</div>
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

    methods: {
      reset: function() {
        this.secondsPassed = 0;
        this.timer = new Timer();
      }
    },

    computed: {
      formatTime() {
        const prependZero = num => (num < 10) ? `0${num}`: `${num}`;
        const totalSeconds = parseInt(this.secondsPassed, 10);

        let minutes = prependZero(Math.floor(totalSeconds / 60));
        let seconds = prependZero(totalSeconds - (minutes * 60));

        return `${minutes}:${seconds}`;
      }
    },

    watch : {
      stopped : function (stopped) {
        this.timer[stopped ? 'stop' : 'start']();
      }
    }
  }
</script>

<style lang="scss" type="text/scss">
  @import '../styles/Timer.scss';
</style>
