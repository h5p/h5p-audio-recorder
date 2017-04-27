/**
 * Enum for the state
 * @enum {string}
 */
const State = {
  UNSUPPORTED: 'unsupported',
  BLOCKED: 'blocked',
  READY: 'ready',
  RECORDING: 'recording',
  PAUSED: 'paused',
  DONE: 'done',
  ERROR: 'error',
  INSECURE_NOT_ALLOWED: 'insecure-not-allowed',
  CANT_CREATE_AUDIO_FILE: 'cant-create-audio-file'
};

export default State;
