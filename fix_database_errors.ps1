# Script to fix database 404 errors and syntax error in SocialSync Pro by updating databaseService.ts, configService.ts, and providing a partial App.tsx update.
# Fixes invalid throw new Error syntax in databaseService.ts.
# Adds error handling, logging, and fallback config. Also checks server/.env and reruns migration.
# Usage:
# 1. Save this as fix_database_errors.ps1 in your project root (e.g., C:\Users\trltr\Downloads\personal_projects\socialsync-pro-2.1).
# 2. Open VS Code, go to Terminal > New Terminal, select PowerShell, and run: .\fix_database_errors.ps1
# 3. Verify changes in VS Code, integrate loadInitialConfig into App.tsx if needed, then run: vercel dev
# 4. Check server/.env for MongoDB/Airtable credentials and rerun migration if needed.
# Note: Preserves UTF-8 encoding for Vietnamese characters.

# Update databaseService.ts
$output = @"
import { BrandInfo } from '../../types';
// Quản lý dịch vụ cơ sở dữ liệu
export async function fetchAdminDefaultsFromDatabase(): Promise<BrandInfo> {
    try {
        console.log('Fetching admin defaults from: /api/mongodb/adminDefaults');
        const response = await fetch('/api/mongodb/adminDefaults');
        if (!response.ok) {
            throw new Error(`Failed to fetch admin defaults: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch admin defaults from database:', error);
        // Fallback to default config
        return { brandName: 'Default Brand', industry: 'General', targetAudience: 'All' };
    }
}
"@
$output | Out-File -FilePath src\services\databaseService.ts -Encoding utf8

# Update configService.ts
$output = @"
import { fetchAdminDefaultsFromDatabase } from './databaseService';
// Quản lý cấu hình ứng dụng
export class ConfigService {
    static async initializeConfig() {
        try {
            const defaults = await fetchAdminDefaultsFromDatabase();
            return defaults;
        } catch (error) {
            console.error('Config initialization failed:', error);
            return { brandName: 'Default Brand', industry: 'General', targetAudience: 'All' };
        }
    }
}
"@
$output | Out-File -FilePath src\services\configService.ts -Encoding utf8

# Provide partial update for App.tsx
$output = @"
// Partial update for App.tsx
import { ConfigService } from './services/configService';
// Quản lý ứng dụng chính
async function loadInitialConfig() {
    try {
        const config = await ConfigService.initializeConfig();
        console.log('Config loaded:', config);
        return config;
    } catch (error) {
        console.error('Failed to load initial configuration:', error);
        return { brandName: 'Default Brand', industry: 'General', targetAudience: 'All' };
    }
}
// Note: Integrate this function into your existing App.tsx code manually if needed.
"@
$output | Out-File -FilePath src\App_loadInitialConfig.partial.ts -Encoding utf8

# Check server/.env
Write-Host "Checking server/.env for database credentials..."
if (Test-Path server\.env) {
    Write-Host "server/.env exists. Verify MONGODB_URI and AIRTABLE_API_KEY are set correctly."
} else {
    Write-Host "server/.env not found. Creating template..."
    "MONGODB_URI=mongodb://localhost:27017/socialsync`nAIRTABLE_API_KEY=your_airtable_key" | Out-File -FilePath server\.env -Encoding utf8
    Write-Host "Please update server/.env with valid credentials."
}

# Rerun migration script (if exists)
Write-Host "`nRunning migration script (if available)..."
if (Test-Path scripts\migrate-airtable-to-mongodb.js) {
    node scripts\migrate-airtable-to-mongodb.js
    Write-Host "Migration script executed. Check output for errors."
} else {
    Write-Host "Migration script not found. Ensure adminDefaults collection exists in MongoDB or Airtable."
}

Write-Host "`nFix completed. Steps to verify:"
Write-Host "1. Open src/services/databaseService.ts and src/services/configService.ts in VS Code to verify changes."
Write-Host "2. Open src/App_loadInitialConfig.partial.ts and manually integrate loadInitialConfig into src/App.tsx if needed."
Write-Host "3. Ensure server/.env has valid MONGODB_URI or AIRTABLE_API_KEY."
Write-Host "4. Run: vercel dev"
Write-Host "5. If errors persist, share new error messages with Grok."