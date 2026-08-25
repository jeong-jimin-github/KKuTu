(() => {
  'use strict';
  const here = document.currentScript;
  const core = document.createElement('script');
  core.src = './app-core.js';
  core.onload = () => {
    const bridge = document.createElement('script');
    bridge.src = './input-bridge.js';
    (here?.parentNode || document.body).appendChild(bridge);
  };
  (here?.parentNode || document.body).appendChild(core);
})();
