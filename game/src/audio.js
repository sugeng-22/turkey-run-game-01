// All of Gobble Run's sound is synthesised with WebAudio: no audio files, nothing to
// load. A cheerful plucked folk loop plays under the run, and every event the world
// reports gets a noise of its own: the turkey's squawk, the farmer's slide-whistle
// stumble, the oven's roar, a knife's whistle-and-clink. The context is only created
// after the player's first key or click (browsers insist), and M mutes everything.

const MELODY = [
  // A bouncy two-bar folk tune in G, as [midi note, beats]; 0 is a rest.
  [67, 1], [71, 1], [74, 1], [71, 1], [79, 1], [76, 1], [74, 1], [71, 1],
  [69, 1], [67, 1], [64, 1], [67, 1], [62, 2], [0, 1], [64, 1],
  [67, 1], [71, 1], [74, 1], [71, 1], [79, 1], [81, 1], [79, 1], [76, 1],
  [74, 1], [71, 1], [69, 1], [71, 1], [67, 3], [0, 1],
];
const BASS = [43, 50, 48, 50, 43, 50, 48, 50]; // one root note a bar-half, G D C D...
const BEAT = 60 / 138 / 2; // eighth notes at 138 bpm

function midiHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function createAudio() {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let muted = false;
  let musicTimer = null;
  let nextNoteAt = 0;
  let melodyStep = 0;
  let bassStep = 0;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.34;
      musicGain.connect(master);
      return true;
    } catch {
      return false;
    }
  }

  function tone({ freq, freqEnd, type = 'sine', at = 0, dur = 0.15, vol = 0.3, dest }) {
    if (!ctx) return;
    const t0 = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(dest ?? master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise({ at = 0, dur = 0.2, vol = 0.25, from = 400, to = 2400, type = 'bandpass' }) {
    if (!ctx) return;
    const t0 = ctx.currentTime + at;
    const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(30, to), t0 + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter).connect(gain).connect(master);
    src.start(t0);
  }

  function scheduleMusic() {
    if (!ctx) return;
    while (nextNoteAt < ctx.currentTime + 0.18) {
      const [note, beats] = MELODY[melodyStep % MELODY.length];
      const at = nextNoteAt - ctx.currentTime;
      if (note > 0) {
        tone({ freq: midiHz(note), type: 'triangle', at, dur: 0.16, vol: 0.5, dest: musicGain });
        tone({ freq: midiHz(note) * 2, type: 'sine', at, dur: 0.08, vol: 0.12, dest: musicGain });
      }
      if (melodyStep % 4 === 0) {
        const bass = BASS[(bassStep >> 2) % BASS.length] + (melodyStep % 8 === 4 ? 7 : 0);
        tone({ freq: midiHz(bass), type: 'square', at, dur: 0.22, vol: 0.16, dest: musicGain });
        bassStep += 1;
      }
      nextNoteAt += beats * BEAT;
      melodyStep += 1;
    }
  }

  return {
    /** Call from any user gesture; starts the music the first time. */
    unlock() {
      if (!ensure()) return;
      if (!musicTimer) {
        nextNoteAt = ctx.currentTime + 0.06;
        musicTimer = window.setInterval(scheduleMusic, 60);
      }
    },
    toggleMute() {
      muted = !muted;
      if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.02);
      return muted;
    },
    get muted() {
      return muted;
    },
    squawk(double = false) {
      if (!ensure()) return;
      tone({ freq: double ? 900 : 720, freqEnd: 300, type: 'sawtooth', dur: 0.16, vol: 0.22 });
      tone({ freq: 1400, freqEnd: 500, type: 'square', dur: 0.1, vol: 0.08 });
      noise({ dur: 0.08, vol: 0.1, from: 1800, to: 700 });
    },
    hurt() {
      if (!ensure()) return;
      tone({ freq: 160, freqEnd: 60, type: 'sine', dur: 0.22, vol: 0.5 });
      tone({ freq: 980, freqEnd: 240, type: 'sawtooth', dur: 0.28, vol: 0.26 });
      noise({ dur: 0.18, vol: 0.2, from: 900, to: 200 });
    },
    corn() {
      if (!ensure()) return;
      tone({ freq: 1046, type: 'sine', dur: 0.09, vol: 0.25 });
      tone({ freq: 1568, type: 'sine', at: 0.07, dur: 0.14, vol: 0.25 });
    },
    pie() {
      if (!ensure()) return;
      [523, 659, 784, 1046].forEach((freq, i) => tone({ freq, type: 'triangle', at: i * 0.07, dur: 0.16, vol: 0.25 }));
    },
    whoosh() {
      if (!ensure()) return;
      noise({ dur: 0.3, vol: 0.3, from: 500, to: 2600 });
    },
    stumble() {
      if (!ensure()) return;
      tone({ freq: 1200, freqEnd: 200, type: 'sine', dur: 0.5, vol: 0.3 });
      noise({ at: 0.42, dur: 0.16, vol: 0.3, from: 300, to: 120, type: 'lowpass' });
    },
    flame() {
      if (!ensure()) return;
      noise({ dur: 0.5, vol: 0.16, from: 900, to: 300, type: 'lowpass' });
    },
    knifeDrop() {
      if (!ensure()) return;
      tone({ freq: 2200, freqEnd: 500, type: 'sine', dur: 0.22, vol: 0.14 });
      tone({ freq: 3400, type: 'square', at: 0.22, dur: 0.05, vol: 0.12 });
      tone({ freq: 2600, type: 'square', at: 0.27, dur: 0.07, vol: 0.1 });
    },
    spotted() {
      if (!ensure()) return;
      tone({ freq: 660, type: 'square', dur: 0.09, vol: 0.16 });
      tone({ freq: 880, type: 'square', at: 0.1, dur: 0.14, vol: 0.16 });
    },
    fanfare(win) {
      if (!ensure()) return;
      const notes = win ? [523, 659, 784, 1046, 784, 1046] : [392, 370, 349, 311];
      notes.forEach((freq, i) => tone({ freq, type: 'triangle', at: i * 0.13, dur: 0.3, vol: 0.3 }));
    },
  };
}
