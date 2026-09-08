/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp?: {
      ready: () => void;
      expand: () => void;
      close: () => void;
      sendData?: (data: string) => void;
      openTelegramLink?: (url: string) => void;
      showConfirm?: (message: string, callback: (confirmed: boolean) => void) => void;
      showAlert?: (message: string, callback?: () => void) => void;
      HapticFeedback?: {
        impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
        notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        selectionChanged: () => void;
      };
      initDataUnsafe?: {
        user?: {
          id: number;
          first_name: string;
          last_name?: string;
          username?: string;
          language_code?: string;
        };
      };
    };
  };
}
