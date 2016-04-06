(function(w, d) {
  //'use strict';

  w.jdl = w.jdl || {};
  w.jdl.Discharge = w.jdl.Discharge || {};
  var jdl = w.jdl;

  // Button appearance adjustment code
  var button = $("#hear"), hear = false;
  function reButton(parity) {
    const face = {color:['black', 'white'], text:['mute', 'hear']};
    button.css(           "color", face.color[+ parity]);
    button.css("background-color", face.color[+!parity]);
    button.text('Click to ' + face.text[+!hear] + ' discharge emulator.');
  }

  // session variables
  var N = 1e3, X = 5, audible = true;  // Samples, duration, toggle value
  var thi = 5e3, dt = thi, tlo = 3, step = 50, flap = 7;  // timeout/bandwidth
  var a1 = 1.035, b1 =   8e-3, c1 = 1e-3;  // depolarize bell curve parameters
  var a2 =  2e-1, b2 = 1.3e-4, c2 = 3e-3;  // repolarize bell curve parameters
  var min = Math.min, floor = Math.floor;  // local renames
  var pow = Math.pow, exp = Math.exp, rand = Math.random, abs = Math.abs;
  var rwave = new Float32Array(N), iwave = new Float32Array(N); // Waveforms
  // webaudio
  var context = w.AudioContext?new w.AudioContext():new w.webkitAudioContext();
  // service functions
  function plus(dt)         { return context.currentTime + dt;             };
  function bell(a, b, c, x) { return a * exp(-pow((x-b) / (2*c), 2));      };
  function spike(x)         { return bell(a1,b1,c1,x) - bell(a2,b2,c2,x);  };
  function band()           { return floor(dt + flap * (rand() - rand())); };

  // Fill the real portion of the waveform (depends on service function spike)
  for (var n = 0; n < N; n++) rwave[n] = spike(n * X / N);

  // This function creates, initializes, and connects sound resources.
  function soundResource() {
    gain = context.createGain();
    gain.gain.value = volume;
    osc  = context.createOscillator();
    osc.setPeriodicWave(context.createPeriodicWave(rwave, iwave));
    osc.connect(gain);
    gain.connect(context.destination);
  }

  // This function produces the sound for a single discharge
  function sound() {
    osc.disconnect();
    gain.disconnect();
    soundResource();
    osc.start();
    osc.stop(plus(5e-3));
  };

  // Provide timing for pulse interval minimizing and decay to max
  var resting = function() { sound(); setTimeout(resting, band()); };
  var excited = function() { dt = tlo; setTimeout(decay, band()); };
  var decay = function() {
    sound();
    dt = min(dt + step, thi);
    setTimeout(dt < thi ? decay : resting, band());
  };

  // This function mutes and unmutes sound production
  function doButton() {
    volume = (volume == 0.0) ? 1.0 : 0.0;
    if (volume == 0.0) context.suspend();
    else context.resume();
    console.log('clicked');
  };

  w.jdl.Discharge.onload = function() {
    // initialize button and attach events
    reButton(false);
    button.hover(function(){ reButton(true); }, function(){ reButton(false); });
    button.click(function(){ hear = !hear; reButton(true); doButton(); });
    console.log('loaded');
  };
  w.jdl.Discharge.excited = excited;
  w.jdl.Discharge.doButton = doButton;

  // Initialize and start discharge mechanism.
  var gain, osc, volume  = hear ? 1.0 : 0.0;
  soundResource();
  excited();
})(window, document);
