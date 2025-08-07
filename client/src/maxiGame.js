window.MaxiGame = {
  closeGame: function() {
      // Android вызовёт window.AndroidInterface.closeGame()
      if (window.AndroidInterface && typeof window.AndroidInterface.closeGame === 'function') {
          window.AndroidInterface.closeGame();
      }
      // iOS вызовет window.webkit.messageHandlers.closeGame.postMessage
      else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.closeGame) {
          window.webkit.messageHandlers.closeGame.postMessage({});
      } else {
          console.log('closeGame не поддерживается на этой платформе');
      }
  },
  activatePromoCode: function(promoCode) {
      // Android вызовет window.AndroidInterface.activatePromoCode(promoCode)
      if (window.AndroidInterface && typeof window.AndroidInterface.activatePromoCode === 'function') {
          window.AndroidInterface.activatePromoCode(promoCode);
      }
      // iOS вызовет window.webkit.messageHandlers.activatePromoCode.postMessage
      else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.activatePromoCode) {
          window.webkit.messageHandlers.activatePromoCode.postMessage({promoCode: promoCode});
      } else {
          console.log('activatePromoCode не поддерживается на этой платформе');
      }
  }
};