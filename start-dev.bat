@REM @echo off
@REM @REM browser-sync start --server --files "**/*.html" "**/*.css" "**/*.js" "**/*.png" "**/*.svg"
@REM browser-sync start --server --host 192.168.0.104 --files "**/*"
@REM pause


@echo off
REM This script detects your Wi-Fi IPv4 address only and runs browser-sync with it

for /f "delims=" %%A in ('powershell -NoProfile -Command ^
    "Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' | Where-Object {$_.PrefixOrigin -ne 'WellKnown'} | Select-Object -ExpandProperty IPAddress"') do (
    set "ip=%%A"
)

REM Check if IP was found
if "%ip%"=="" (
    echo ❌ Could not find Wi-Fi IPv4 address. Make sure you're connected to Wi-Fi.
    pause
    exit /b
)

echo ✅ Detected Wi-Fi IP: %ip%
echo 🌐 Starting browser-sync...

browser-sync start --server --host %ip% --files "**/*"

pause



