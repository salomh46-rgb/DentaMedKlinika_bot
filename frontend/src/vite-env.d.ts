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
      initData?: string;
      CloudStorage?: {
        setItem: (key: string, value: string, callback?: (error: any, result?: boolean) => void) => void;
        getItem: (key: string, callback: (error: any, result?: string) => void) => void;
        getItems: (keys: string[], callback: (error: any, result?: Record<string, string>) => void) => void;
        removeItem: (key: string, callback?: (error: any, result?: boolean) => void) => void;
        removeItems: (keys: string[], callback?: (error: any, result?: boolean) => void) => void;
        getKeys: (callback: (error: any, result?: string[]) => void) => void;
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
