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

  // Interval timing and rate variables, gain volume, and active timeout array
  var dtRest = 2e3, dtThis = dtRest, dtFast = 20, rate = 5e-2, delta = 20;
  var volume  = hear ? 1.0 : 0.0;
  var timeouts = [];

  // Local renames
  var floor = Math.floor, ceil = Math.ceil, rand = Math.random;

  // webaudio
  var context = w.AudioContext?new w.AudioContext():new w.webkitAudioContext();
  // Setup single-shot waveform
  var samples = context.sampleRate;
  var frames  = samples * 5e-3, frame2 = frames / 2, frame3 = frames / 3;
  var buffer  = context.createBuffer(1, frames, samples);
  var data    = buffer.getChannelData(0);
  // Make a triphasic waveform, as taught by JYL
  for (var i=0, f0=0, f1=frame3, f2=2*f1; i<f1; i++) {
      data[f0 + i] = -0.5; data[f1 + i] = +1.0; data[f2 + i] = -0.5;
  }

  // service functions
  function now()   { return context.currentTime; }
  function plus(t) { return now() + t;           };
  function band()  { return floor(dtThis + delta * (rand() - rand())); };
  function clear() { for (var timeout of timeouts) clearTimeout(timeout); }

  // Fire and forget single-shot
  function sound() {
      clear();  // Discard prior timeouts.
      if (volume != 0.0) {
        var source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(now(), 0, plus(5e-3));
      }
  }

  // Provide timing for pulse interval minimizing and decay to max
  function interval(t, f) {
      dtThis = t;
      sound();
      timeouts.push(setTimeout(f, band()));
  }
  function resting() {
      interval( dtThis, resting);
  }
  function decay() {
      dtThis = ceil(dtThis + (dtRest - dtThis) * rate);
      var f = (dtThis >= dtRest) ? resting : decay;
      interval(dtThis, f);
  }

  // This function mutes and unmutes sound production
  var doButton = w.jdl.Discharge.doButton = function() {
    volume = (volume == 0.0) ? 1.0 : 0.0;
    if (volume == 0.0) context.suspend();
    else context.resume();
  };

  // Functions visible to other scripts through the jdl namespace
  w.jdl.Discharge.excited = function() {
      interval(dtFast, decay);
  };

  w.jdl.Discharge.onload = function() {
    // initialize button and attach events
    reButton(false);
    button.hover(function(){ reButton(true); }, function(){ reButton(false); });
    button.click(function(){ hear = !hear; reButton(true); doButton(); });
  };

  // Initialize execution
  resting();

})(window, document);
