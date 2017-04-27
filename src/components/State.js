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
  INSECURE_NOT_ALLOWED: 'insecure-not-allowed'
};

export default State;
