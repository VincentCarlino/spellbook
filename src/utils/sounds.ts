let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function playPing() {
  const ac = getCtx();

  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.4);

  gain.gain.setValueAtTime(0, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0.35, ac.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);

  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.5);
}
