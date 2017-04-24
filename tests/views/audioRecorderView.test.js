import test from 'ava';
import Vue from 'vue';
import AudioRecorderView from '../../src/views/AudioRecorder.vue';
import Timer from '../../src/views/Timer.vue';
import State from '../../src/components/State';

// setup initial state for audio recorder
AudioRecorderView.data = () => ({
  title: 'Title',
  state: State.READY,
  statusMessages: {},
  l10n: {},
  audioSrc: '',
  audioFilename: ''
});

// prepare viewModel
test.beforeEach(t => {
  t.context.vm = new Vue({
    ...AudioRecorderView,
    components: {
      timer: Timer
    }
  }).$mount();
});

test('change state to recording', async t => {
  t.context.vm.state = State.RECORDING;

  Vue.nextTick(() => {
    console.log(t.context.vm.$el.innerHTML);
    t.pass();
  });
});