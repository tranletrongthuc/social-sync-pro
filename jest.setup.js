Object.defineProperty(global, 'import_meta_env_mock', {
  value: {
    VITE_GEMINI_API_KEY: 'test-api-key',
    VITE_AIRTABLE_PAT: 'test-pat',
    VITE_AIRTABLE_BASE_ID: 'test-base-id',
    VITE_CLOUDINARY_CLOUD_NAME: 'test-cloud-name',
    VITE_CLOUDINARY_UPLOAD_PRESET: 'test-upload-preset',
    VITE_CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
    VITE_CLOUDFLARE_API_TOKEN: 'test-api-token',
    VITE_OPENROUTER_API_KEY: 'test-api-key',
  },
  writable: true,
});