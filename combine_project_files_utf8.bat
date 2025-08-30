@echo off
setlocal EnableDelayedExpansion

:: Script to combine all project files into one UTF-8 encoded output file (combined_project.txt).
:: Handles Vietnamese characters using PowerShell for robust UTF-8 encoding.
:: Usage:
:: 1. Save this as combine_project_files_utf8.bat in your project root (e.g., social-sync-pro).
:: 2. Open VS Code, go to Terminal > New Terminal, and run: combine_project_files_utf8.bat
:: 3. The script creates combined_project.txt in UTF-8 encoding.
:: 4. Open combined_project.txt in VS Code, verify encoding (UTF-8 in bottom-right corner), remove sensitive data (e.g., API keys), and upload to Grok or paste contents.
:: Note: Excludes node_modules, .git, .env, .env.local, dist, build, and *.log files for security and brevity.

:: Set Command Prompt to UTF-8 encoding
chcp 65001 >nul

:: Create a temporary PowerShell script with simplified filtering
echo $output = "=== Project Analysis File ===\n" > temp_ps.ps1
echo $output += "Generated on: $(Get-Date)\n" >> temp_ps.ps1
echo $output += "Project Root: $PWD\n\n" >> temp_ps.ps1
echo $output += "=== File Structure (Tree View) ===\n" >> temp_ps.ps1
echo $output += (Get-ChildItem -Recurse -File ^| Where-Object { $_.FullName -notlike '*node_modules*' -and $_.FullName -notlike '*.git*' -and $_.FullName -notlike '*dist*' -and $_.FullName -notlike '*build*' -and $_.FullName -notlike '*.env*' -and $_.FullName -notlike '*.log' } ^| Select-Object -ExpandProperty FullName ^| ForEach-Object { $_ }) -join "\n" >> temp_ps.ps1
echo $output += "\n\n=== File Contents ===\n" >> temp_ps.ps1
echo Get-ChildItem -Recurse -File ^| Where-Object { $_.FullName -notlike '*node_modules*' -and $_.FullName -notlike '*.git*' -and $_.FullName -notlike '*dist*' -and $_.FullName -notlike '*build*' -and $_.FullName -notlike '*.env*' -and $_.FullName -notlike '*.log' } ^| ForEach-Object { >> temp_ps.ps1
echo     $file = $_.FullName >> temp_ps.ps1
echo     $output += "\n--- File: $file ---\n" >> temp_ps.ps1
echo     if ($file -like '*.env*') { >> temp_ps.ps1
echo         $output += "[Sensitive file: Contents omitted for security. Manually review if needed.]\n" >> temp_ps.ps1
echo     } else { >> temp_ps.ps1
echo         try { >> temp_ps.ps1
echo             $content = Get-Content -Path $file -Raw -Encoding UTF8 >> temp_ps.ps1
echo             $output += $content + "\n" >> temp_ps.ps1
echo         } catch { >> temp_ps.ps1
echo             $output += "[Binary or unreadable file: Contents omitted.]\n" >> temp_ps.ps1
echo         } >> temp_ps.ps1
echo     } >> temp_ps.ps1
echo     $output += "--- End of File: $file ---\n" >> temp_ps.ps1
echo } >> temp_ps.ps1
echo $output += "\n=== End of Project Analysis File ===\n" >> temp_ps.ps1
echo $output += "Upload this file to Grok. If sensitive data (e.g., API keys) appears, edit it out before uploading.\n" >> temp_ps.ps1
echo $output ^| Out-File -FilePath combined_project.txt -Encoding utf8 >> temp_ps.ps1

:: Run the PowerShell script
powershell -ExecutionPolicy Bypass -File temp_ps.ps1

:: Clean up temporary PowerShell script
del temp_ps.ps1

echo.
echo Script completed. Check combined_project.txt in your project root.
echo 1. Open combined_project.txt in VS Code and verify encoding (UTF-8 in bottom-right corner).
echo 2. Remove any sensitive data (e.g., API keys) before uploading.
echo 3. Upload to Grok or paste contents into your conversation with Grok.