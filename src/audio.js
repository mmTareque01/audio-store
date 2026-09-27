// A small generative loop (pad chord + soft kick + hats) and a radial visualiser.
export function createAudio(canvas) {
  const g = canvas.getContext('2d');
  let ctx = null, analyser = null, master = null, data = null, timer = null, playing = false;
  let w = 0, h = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  resize();
  window.addEventListener('resize', resize);

  function setup() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    data = new Uint8Array(analyser.frequencyBinCount);
    master.connect(analyser);
    analyser.connect(ctx.destination);

    // Pad: detuned saws through a breathing low-pass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.Q.value = 6;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 600;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    const pad = ctx.createGain();
    pad.gain.value = 0.05;
    filter.connect(pad).connect(master);
    [110, 164.81, 246.94, 277.18, 415.3].forEach((f) =>
      [-7, 7].forEach((d) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = d;
        o.connect(filter);
        o.start();
      }),
    );
  }

  function kick(t) {
    const o = ctx.createOscillator(), v = ctx.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.25);
    v.gain.setValueAtTime(0.9, t);
    v.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    o.connect(v).connect(master);
    o.start(t);
    o.stop(t + 0.5);
  }
  function hat(t) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), v = ctx.createGain();
    src.buffer = buf;
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    v.gain.setValueAtTime(0.12, t);
    v.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(hp).connect(v).connect(master);
    src.start(t);
  }

  let step = 0, next = 0;
  const beat = 60 / 96 / 2; // eighth notes at 96 bpm
  function schedule() {
    while (next < ctx.currentTime + 0.12) {
      if (step % 4 === 0) kick(next);
      if (step % 2 === 1) hat(next);
      next += beat;
      step++;
    }
  }

  async function toggle() {
    if (!ctx) setup();
    if (ctx.state === 'suspended') await ctx.resume();
    playing = !playing;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(playing ? 0.35 : 0, now, 0.25);
    clearInterval(timer);
    if (playing) {
      next = now + 0.05;
      timer = setInterval(schedule, 25);
    }
    return playing;
  }

  function stop() { if (playing) toggle(); }

  // Visualiser: radial bars + inner waveform ring
  function draw(t) {
    if (!w) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const n = 96, cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.3;
    if (analyser) analyser.getByteFrequencyData(data);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const idle = (Math.sin(t * 1.6 + i * 0.45) * 0.5 + 0.5) * 0.12 + (Math.sin(t * 0.7 + i * 0.13) * 0.5 + 0.5) * 0.08;
      const live = playing && data ? data[Math.floor(((i < n / 2 ? i : n - i) / (n / 2)) * 90)] / 255 : 0;
      const v = Math.max(idle, live);
      const len = 10 + v * r * 0.9;
      g.strokeStyle = i % 8 === 0 ? '#ff4f1f' : `rgba(255,255,255,${0.25 + v * 0.75})`;
      g.lineWidth = 3;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      g.lineTo(cx + Math.cos(a) * (r + len), cy + Math.sin(a) * (r + len));
      g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,.12)';
    g.lineWidth = 1;
    g.beginPath();
    g.arc(cx, cy, r - 16, 0, Math.PI * 2);
    g.stroke();
  }

  return { toggle, stop, draw, resize };
}
