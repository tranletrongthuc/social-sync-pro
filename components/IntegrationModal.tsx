import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui';
import { UploadIcon, PlugIcon, CheckCircleIcon, LinkIcon } from './icons';
import { Persona } from '../types';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onCredentialsConfigured: () => void;
  personaToConnect: Persona | null;
  platformToConnect: string | null;
  onSocialAccountConnected: (persona: Persona) => void;
}

const IntegrationModal: React.FC<IntegrationModalProps> = ({ isOpen, onClose, language, onCredentialsConfigured, personaToConnect, platformToConnect, onSocialAccountConnected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConnectingSocialAccount, setIsConnectingSocialAccount] = useState(false);

  interface CredentialStatus {
    airtable: boolean;
    cloudinary: boolean;
    openrouter: boolean;
    cloudflare: boolean;
  }
  const [credentialStatus, setCredentialStatus] = useState<CredentialStatus>({ airtable: false, cloudinary: false, openrouter: false, cloudflare: false });

  const checkCredentialStatus = (): CredentialStatus => ({
      airtable: !!((window as any).process.env.AIRTABLE_PAT && (window as any).process.env.AIRTABLE_BASE_ID),
      cloudinary: !!((window as any).process.env.CLOUDINARY_CLOUD_NAME && (window as any).process.env.CLOUDINARY_UPLOAD_PRESET),
      openrouter: !!(window as any).process.env.OPENROUTER_API_KEY,
      cloudflare: !!((window as any).process.env.CLOUDFLARE_ACCOUNT_ID && (window as any).process.env.CLOUDFLARE_API_TOKEN),
  });

  useEffect(() => {
    if (isOpen) {
        setCredentialStatus(checkCredentialStatus());
        const intervalId = setInterval(() => {
            setCredentialStatus(checkCredentialStatus());
        }, 500);
        return () => clearInterval(intervalId);
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  const handleCredentialFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const content = event.target?.result as string;
            const creds = JSON.parse(content);
            const initialStatus = checkCredentialStatus();
            
            if (creds.AIRTABLE_PAT) (window as any).process.env.AIRTABLE_PAT = creds.AIRTABLE_PAT;
            if (creds.AIRTABLE_BASE_ID) (window as any).process.env.AIRTABLE_BASE_ID = creds.AIRTABLE_BASE_ID;
            if (creds.CLOUDINARY_CLOUD_NAME) (window as any).process.env.CLOUDINARY_CLOUD_NAME = creds.CLOUDINARY_CLOUD_NAME;
            if (creds.CLOUDINARY_UPLOAD_PRESET) (window as any).process.env.CLOUDINARY_UPLOAD_PRESET = creds.CLOUDINARY_UPLOAD_PRESET;
            if (creds.OPENROUTER_API_KEY) (window as any).process.env.OPENROUTER_API_KEY = creds.OPENROUTER_API_KEY;
            if (creds.CLOUDFLARE_ACCOUNT_ID) (window as any).process.env.CLOUDFLARE_ACCOUNT_ID = creds.CLOUDFLARE_ACCOUNT_ID;
            if (creds.CLOUDFLARE_API_TOKEN) (window as any).process.env.CLOUDFLARE_API_TOKEN = creds.CLOUDFLARE_API_TOKEN;
            if (creds.FACEBOOK_APP_ID) (window as any).process.env.FACEBOOK_APP_ID = creds.FACEBOOK_APP_ID;
            
            const newStatus = checkCredentialStatus();
            setCredentialStatus(newStatus);
            
            // If Airtable specifically becomes configured, trigger the callback
            if (!initialStatus.airtable && newStatus.airtable) {
                onCredentialsConfigured();
            }

        } catch (err) {
            console.error("Failed to parse credential file:", err);
            alert("Failed to read or parse the JSON file. Please ensure it's valid.");
        }
    };
    reader.onerror = () => {
        alert("Error reading file.");
    }
    reader.readAsText(file);
    e.target.value = '';
  };

  const T = {
    'Việt Nam': {
      title: 'Quản lý Tích hợp',
      subtitle: 'Cung cấp thông tin đăng nhập cho các dịch vụ bên ngoài.',
      external_services: 'Dịch vụ Bên ngoài (Nâng cao)',
      upload_creds: 'Tải lên tệp Credentials.ssproj',
      creds_file_format: 'Tệp phải chứa các khóa cho Airtable, Cloudinary, OpenRouter và/hoặc Cloudflare:',
      creds_status: 'Trạng thái Credentials',
      airtable_status: 'Airtable',
      cloudinary_status: 'Cloudinary',
      openrouter_status: 'OpenRouter',
      cloudflare_status: 'Cloudflare',
      configured: 'Đã cấu hình',
      not_configured: 'Chưa cấu hình',
      close: 'Đóng',
      connect_social_account_title: 'Kết nối tài khoản xã hội',
      connect_social_account_subtitle: (personaName: string, platformName: string) => `Vui lòng kết nối tài khoản ${platformName} cho KOL/KOC ${personaName} để tiếp tục.`,
      connect_button: 'Kết nối',
      connecting: 'Đang kết nối...',
    },
    'English': {
      title: 'Integration Management',
      subtitle: 'Provide credentials for external services.',
      external_services: 'External Services (Advanced)',
      upload_creds: 'Upload Credentials.ssproj File',
      creds_file_format: 'The file should contain keys for Airtable, Cloudinary, OpenRouter, and/or Cloudflare:',
      creds_status: 'Credential Status',
      airtable_status: 'Airtable',
      cloudinary_status: 'Cloudinary',
      openrouter_status: 'OpenRouter',
      cloudflare_status: 'Cloudflare',
      configured: 'Configured',
      not_configured: 'Not Configured',
      close: 'Close',
      connect_social_account_title: 'Connect Social Account',
      connect_social_account_subtitle: (personaName: string, platformName: string) => `Please connect the ${platformName} account for persona ${personaName} to proceed.`,
      connect_button: 'Connect',
      connecting: 'Connecting...',
    }
  };
  const texts = (T as any)[language] || T['English'];

  const handleConnectSocialAccount = async () => {
    if (!personaToConnect || !platformToConnect) return;

    setIsConnectingSocialAccount(true);
    try {
      const { connectSocialAccountToPersona } = await import('../services/socialAccountService');
      const updatedPersona = await connectSocialAccountToPersona(personaToConnect, platformToConnect as any);
      onSocialAccountConnected(updatedPersona as Persona);
      onClose();
    } catch (error) {
      console.error("Failed to connect social account:", error);
      alert(`Failed to connect ${platformToConnect} account. Please try again.`);
    } finally {
      setIsConnectingSocialAccount(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-8 border border-gray-200 m-4 transform transition-all max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <PlugIcon className="h-8 w-8 text-brand-green" />
              {personaToConnect ? texts.connect_social_account_title : texts.title}
            </h2>
            <p className="text-gray-500 mt-1 font-serif">
              {personaToConnect ? texts.connect_social_account_subtitle(personaToConnect.nickName, platformToConnect!) : texts.subtitle}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-3xl">&times;</button>
        </div>
        
        {personaToConnect && platformToConnect ? (
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
        ) : (
          <div className="mt-6 space-y-8 flex-grow overflow-y-auto pr-2">
              {/* External Services Section */}
              <div>
                   <h3 className="text-lg font-semibold text-gray-800 mb-3">{texts.external_services}</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2">
                              <UploadIcon />
                              {texts.upload_creds}
                          </Button>
                          <input type="file" ref={fileInputRef} onChange={handleCredentialFileChange} className="hidden" accept=".json" />
                          
                          <div>
                              <p className="text-sm text-gray-500 font-serif">{texts.creds_file_format}</p>
                              <pre className="mt-2 bg-gray-200 p-3 rounded-md text-xs text-gray-700 overflow-x-auto">
                                  <code>
{`{
  "AIRTABLE_PAT": "...",
  "AIRTABLE_BASE_ID": "...",
  "CLOUDINARY_CLOUD_NAME": "...",
  "CLOUDINARY_UPLOAD_PRESET": "...",
  "OPENROUTER_API_KEY": "...",
  "CLOUDFLARE_ACCOUNT_ID": "...",
  "CLOUDFLARE_API_TOKEN": "..."
}`}
                                  </code>
                              </pre>
                          </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="text-md font-semibold text-gray-800 mb-3">{texts.creds_status}</h4>
                          <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                  <span className="text-gray-700">{texts.airtable_status}</span>
                                  {credentialStatus.airtable ? (
                                      <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
                                          <CheckCircleIcon className="h-4 w-4" />
                                          {texts.configured}
                                      </span>
                                  ) : (
                                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">{texts.not_configured}</span>
                                  )}
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-gray-700">{texts.cloudinary_status}</span>
                                  {credentialStatus.cloudinary ? (
                                       <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
                                          <CheckCircleIcon className="h-4 w-4" />
                                          {texts.configured}
                                      </span>
                                  ) : (
                                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">{texts.not_configured}</span>
                                  )}
                              </div>
                               <div className="flex justify-between items-center">
                                  <span className="text-gray-700">{texts.openrouter_status}</span>
                                  {credentialStatus.openrouter ? (
                                       <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
                                          <CheckCircleIcon className="h-4 w-4" />
                                          {texts.configured}
                                      </span>
                                  ) : (
                                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">{texts.not_configured}</span>
                                  )}
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-gray-700">{texts.cloudflare_status}</span>
                                  {credentialStatus.cloudflare ? (
                                       <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
                                          <CheckCircleIcon className="h-4 w-4" />
                                          {texts.configured}
                                      </span>
                                  ) : (
                                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">{texts.not_configured}</span>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-6 mt-auto border-t border-gray-200">
            <Button type="button" onClick={onClose} variant="tertiary">
                {texts.close}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationModal;