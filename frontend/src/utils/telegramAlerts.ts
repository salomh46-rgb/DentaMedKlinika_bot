// Telegram WebApp Native Dialogs and Haptics Helper

export const showTelegramConfirm = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  // Check if Telegram WebApp SDK is available with showConfirm support
  if (window.Telegram?.WebApp?.showConfirm) {
    window.Telegram.WebApp.HapticFeedback?.notificationOccurred('warning');
    window.Telegram.WebApp.showConfirm(message, (confirmed: boolean) => {
      if (confirmed) {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
        onConfirm();
      } else {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
        if (onCancel) onCancel();
      }
    });
  } else {
    // Desktop browser fallback
    if (window.confirm(message)) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  }
};

export const showTelegramAlert = (message: string, onClose?: () => void) => {
  if (window.Telegram?.WebApp?.showAlert) {
    window.Telegram.WebApp.HapticFeedback?.notificationOccurred('warning');
    window.Telegram.WebApp.showAlert(message, () => {
      if (onClose) onClose();
    });
  } else {
    alert(message);
    if (onClose) onClose();
  }
};
