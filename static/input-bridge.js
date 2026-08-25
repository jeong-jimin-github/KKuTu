(() => {
  'use strict';

  const chatInput = document.getElementById('GameTalk');
  const chatButton = document.getElementById('GameChatBtn');
  const gameInput = document.getElementById('game-input');
  const gameInputWrap = document.getElementById('GameInputWrap');

  if (!chatInput || !chatButton || !gameInput || !gameInputWrap) return;

  const isPlayerTurn = () =>
    !document.getElementById('GameView')?.classList.contains('static-hidden') &&
    gameInputWrap.classList.contains('static-active');

  const mirror = () => {
    if (isPlayerTurn()) gameInput.value = chatInput.value;
  };

  const submitGameWord = () => {
    if (!isPlayerTurn()) return false;
    const value = chatInput.value.trim();
    if (!value) return true;

    gameInput.value = value;
    chatInput.value = '';
    gameInput.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    }));
    return true;
  };

  // Original desktop KKuTu uses the bottom Talk box as both chat and game input.
  // Capture handlers run before app.js's normal chat handlers so a player's turn
  // is submitted to the local game engine instead of being appended as chat.
  chatInput.addEventListener('input', mirror, true);
  chatInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    if (!submitGameWord()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  chatButton.addEventListener('click', (event) => {
    if (!submitGameWord()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  // app.js currently focuses the center mirror input at turn start. Redirect that
  // focus to the original bottom input box, preserving the original UI behavior.
  gameInput.addEventListener('focus', () => {
    if (!isPlayerTurn()) return;
    queueMicrotask(() => {
      chatInput.placeholder = gameInput.placeholder || '당신의 차례입니다. 단어를 입력하세요.';
      chatInput.focus({ preventScroll: true });
      mirror();
    });
  }, true);

  const observer = new MutationObserver(() => {
    if (isPlayerTurn()) {
      chatInput.placeholder = gameInput.placeholder || '당신의 차례입니다. 단어를 입력하세요.';
      chatInput.focus({ preventScroll: true });
    } else {
      chatInput.placeholder = '';
      gameInput.value = '';
    }
  });
  observer.observe(gameInputWrap, { attributes: true, attributeFilter: ['class'] });
})();
