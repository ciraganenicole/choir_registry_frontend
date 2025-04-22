import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt variable
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 rounded-lg bg-blue-100 p-4 shadow-lg md:left-auto md:right-4 md:w-96">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900">
            Installer l&apos;application
          </h3>
          <p className="mt-1 text-sm text-blue-700">
            Installez notre application pour un accès plus rapide et une
            meilleure expérience
          </p>
        </div>
        <div className="ml-4 flex shrink-0 space-x-2">
          <button
            onClick={() => setShowPrompt(false)}
            className="rounded bg-blue-50 px-3 py-1 text-sm font-medium text-blue-900 hover:bg-blue-200"
          >
            Plus tard
          </button>
          <button
            onClick={handleInstallClick}
            className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600"
          >
            Installer
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
