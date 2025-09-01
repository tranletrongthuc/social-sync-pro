import React, { useState } from 'react';
import { Button } from './ui';
import { LinkIcon } from './icons';
import { Persona } from '../../types';
import { connectSocialAccountToPersona } from '../services/socialAccountService'; // Assuming this is the correct import

interface PersonaConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  personaToConnect: Persona | null;
  platformToConnect: string | null;
  onSocialAccountConnected: (persona: Persona) => void; // Callback to update persona in App.tsx
}

const PersonaConnectModal: React.FC<PersonaConnectModalProps> = ({ isOpen, onClose, language, personaToConnect, platformToConnect, onSocialAccountConnected }) => {
  const [isConnectingSocialAccount, setIsConnectingSocialAccount] = useState(false);

  if (!isOpen || !personaToConnect || !platformToConnect) return null;

  const T = {
    'Việt Nam': {
      connect_social_account_title: 'Kết nối tài khoản xã hội',
      connect_social_account_subtitle: (personaName: string, platformName: string) => `Vui lòng kết nối tài khoản ${platformName} cho KOL/KOC ${personaName} để tiếp tục.`,
      connect_button: 'Kết nối',
      connecting: 'Đang kết nối...',
      failed_to_connect: (platformName: string) => `Không thể kết nối tài khoản ${platformName}. Vui lòng thử lại.`,
      close: 'Đóng',
    },
    'English': {
      connect_social_account_title: 'Connect Social Account',
      connect_social_account_subtitle: (personaName: string, platformName: string) => `Please connect the ${platformName} account for persona ${personaName} to proceed.`,
      connect_button: 'Connect',
      connecting: 'Connecting...',
      failed_to_connect: (platformName: string) => `Failed to connect ${platformName} account. Please try again.`,
      close: 'Close',
    }
  };
  const texts = (T as any)[language] || T['English'];

  const handleConnectSocialAccount = async () => {
    if (!personaToConnect || !platformToConnect) return;

    setIsConnectingSocialAccount(true);
    try {
      const updatedPersona = await connectSocialAccountToPersona(personaToConnect, platformToConnect as any);
      onSocialAccountConnected(updatedPersona as Persona);
      onClose(); // Close the modal on successful connection
    } catch (error) {
      console.error("Failed to connect social account:", error);
      alert(texts.failed_to_connect(platformToConnect));
    } finally {
      setIsConnectingSocialAccount(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 border border-gray-200 m-4 transform transition-all max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {texts.connect_social_account_title}
            </h2>
            <p className="text-gray-500 mt-1 font-serif">
              {texts.connect_social_account_subtitle(personaToConnect.nickName, platformToConnect)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-3xl">&times;</button>
        </div>
        
        <div className="mt-6 flex-grow flex flex-col items-center justify-center text-center">
          <p className="text-lg text-gray-700 mb-4">
            {texts.connect_social_account_subtitle(personaToConnect.nickName, platformToConnect)}
          </p>
          <Button
            onClick={handleConnectSocialAccount}
            disabled={isConnectingSocialAccount}
            className="mt-4 px-6 py-3 text-lg flex items-center gap-2"
          >
            {isConnectingSocialAccount ? (
              <>
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                <span>{texts.connecting}</span>
              </>
            ) : (
              <>
                <LinkIcon className="h-5 w-5" />
                <span>{texts.connect_button}</span>
              </>
            )}
          </Button>
        </div>

        <div className="flex justify-end gap-4 pt-6 mt-auto border-t border-gray-200">
            <Button type="button" onClick={onClose} variant="tertiary">
                {texts.close}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default PersonaConnectModal;
