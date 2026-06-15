<#
.SYNOPSIS
    Complete setup and launch script for TrashCam Expo dev client (SDK 52)
    
.DESCRIPTION
    This script handles the entire workflow:
    1. Checks for connected iOS/Android devices/simulators
    2. Attempts to start a simulator if none found
    3. Builds and installs the dev client
    4. Starts the Expo dev server
    
.EXAMPLE
    .\run_dev_client.ps1 -Platform ios
    
.EXAMPLE
    .\run_dev_client.ps1 -Platform android -EmulatorName "Pixel_6_API_34"
#>

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("ios", "android")]
    [string]$Platform = "ios",
    
    [string]$EmulatorName = "",
    [string]$Simulator = "iPhone 16",
    [switch]$SkipBuild = $false,
    [switch]$UseTunnel = $false
)

$ErrorActionPreference = "Stop"

# Colors
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }

Write-Info "TrashCam Dev Client Setup (SDK 52) - Platform: $Platform"
Write-Info "========================================================="

if ($Platform -eq "ios") {
    # iOS/macOS path
    Write-Info "Step 1: Checking iOS development tools..."
    
    # Check if on macOS (required for iOS)
    if ($IsMacOS -or $IsLinux) {
        # Running on macOS/Linux - check for Xcode tools
        $xcodeCheck = Get-Command xcodebuild -ErrorAction SilentlyContinue
        if (-not $xcodeCheck) {
            Write-Fail "Xcode command line tools not found."
            Write-Info "Please install Xcode from the App Store and run: xcode-select --install"
            exit 1
        }
        Write-Success "Xcode tools found"
    }
    else {
        # Running on Windows - can't build iOS locally
        Write-Fail "iOS builds require macOS with Xcode installed."
        Write-Info "You have two options:"
        Write-Info "  1. Use a Mac to run: npx expo run:ios"
        Write-Info "  2. Use EAS Build (cloud): eas build -p ios --profile development"
        Write-Info "  3. Switch to Android: .\run_dev_client.ps1 -Platform android"
        exit 1
    }
    
    # Step 2: Check for iOS simulators/devices
    Write-Info "`nStep 2: Checking for iOS simulators/devices..."
    
    if ($IsMacOS) {
        $simulators = xcrun simctl list devices available | Select-String "iPhone"
        
        if ($simulators) {
            Write-Success "iOS simulators available"
            
            # Check if any booted
            $booted = xcrun simctl list devices | Select-String "Booted"
            
            if (-not $booted) {
                Write-Info "Starting simulator: $Simulator"
                try {
                    xcrun simctl boot "$Simulator" 2>&1 | Out-Null
                    Start-Sleep -Seconds 5
                    Write-Success "Simulator started"
                }
                catch {
                    Write-Warn "Could not auto-start simulator. Opening Simulator app..."
                    open -a Simulator
                    Start-Sleep -Seconds 5
                }
            }
            else {
                Write-Success "Simulator already running"
            }
        }
        else {
            Write-Fail "No iOS simulators found. Please open Xcode and install simulators."
            exit 1
        }
    }
    
    # Step 3: Build iOS dev client
    if (-not $SkipBuild) {
        Write-Info "`nStep 3: Building iOS dev client (SDK 52)..."
        Write-Warn "First build may take 10-15 minutes (CocoaPods, dependencies, etc.)"
        
        try {
            npx expo run:ios
            Write-Success "iOS dev client installed successfully!"
        }
        catch {
            Write-Fail "iOS build failed. Error: $_"
            Write-Info "Common fixes:"
            Write-Info "  1. Run 'npx pod-install' or 'cd ios && pod install'"
            Write-Info "  2. Open ios/*.xcworkspace in Xcode and resolve signing issues"
            Write-Info "  3. Ensure Xcode Command Line Tools: xcode-select --install"
            exit 1
        }
    }
    else {
        Write-Warn "Skipping build (-SkipBuild flag set)"
    }
    
}
else {
    # Android path (original logic)
    Write-Info "Step 1: Checking Android SDK setup..."
    $sdkPath = "C:\Users\likhi\AppData\Local\Android\Sdk"
    $adbPath = Join-Path $sdkPath "platform-tools\adb.exe"

    if (-not (Test-Path $adbPath)) {
        Write-Fail "adb.exe not found at $adbPath"
        Write-Info "Please run Android Studio once or install Android SDK manually."
        exit 1
    }

    Write-Success "Android SDK found at $sdkPath"

    # Update PATH for this session
    $env:PATH += ";$sdkPath\platform-tools;$sdkPath\emulator"
    $env:ANDROID_HOME = $sdkPath
    $env:ANDROID_SDK_ROOT = $sdkPath

    # Step 2: Check for connected devices
    Write-Info "`nStep 2: Checking for connected devices/emulators..."
    $devices = & $adbPath devices | Select-Object -Skip 1 | Where-Object { $_ -match '\tdevice$' }

    if ($devices.Count -gt 0) {
        Write-Success "Found $($devices.Count) connected device(s)"
        $devices | ForEach-Object { Write-Info "  - $_" }
    }
    else {
        Write-Warn "No devices connected."
        
        # Try to list available emulators
        $emulatorExe = Join-Path $sdkPath "emulator\emulator.exe"
        
        if (Test-Path $emulatorExe) {
            Write-Info "Checking available emulators..."
            $availableEmulators = & $emulatorExe -list-avds
            
            if ($availableEmulators) {
                Write-Info "Available emulators:"
                $availableEmulators | ForEach-Object { Write-Info "  - $_" }
                
                # Use provided emulator name or first available
                $emuToStart = if ($EmulatorName) { $EmulatorName } else { $availableEmulators[0] }
                
                Write-Info "Starting emulator: $emuToStart"
                Write-Warn "This may take 30-60 seconds. Please wait..."
                
                # Start emulator in background
                Start-Process -FilePath $emulatorExe -ArgumentList "-avd", $emuToStart, "-no-snapshot-load" -WindowStyle Minimized
                
                # Wait for device
                Write-Info "Waiting for emulator to boot..."
                $timeout = 120
                $elapsed = 0
                
                while ($elapsed -lt $timeout) {
                    Start-Sleep -Seconds 5
                    $elapsed += 5
                    $bootCheck = & $adbPath devices | Select-Object -Skip 1 | Where-Object { $_ -match '\tdevice$' }
                    
                    if ($bootCheck) {
                        Write-Success "Emulator is online!"
                        break
                    }
                    
                    Write-Host "." -NoNewline
                }
                
                if ($elapsed -ge $timeout) {
                    Write-Fail "Emulator failed to start within $timeout seconds"
                    Write-Info "Please start an emulator manually via Android Studio and re-run this script."
                    exit 1
                }
            }
            else {
                Write-Fail "No emulators available."
                Write-Info "Please create an emulator in Android Studio (Device Manager)."
                Write-Info "Then run this script again or specify: .\run_dev_client.ps1 -Platform android -EmulatorName 'YourEmulatorName'"
                exit 1
            }
        }
        else {
            Write-Fail "Emulator tool not found. Please install Android SDK via Android Studio."
            exit 1
        }
    }

    # Step 3: Build and install dev client
    if (-not $SkipBuild) {
        Write-Info "`nStep 3: Building and installing Android dev client (SDK 52)..."
        Write-Warn "First build may take 5-10 minutes (downloading Gradle, dependencies, etc.)"
        
        try {
            npx expo run:android
            Write-Success "Android dev client installed successfully!"
        }
        catch {
            Write-Fail "Build failed. Error: $_"
            Write-Info "Common fixes:"
            Write-Info "  1. Open Android Studio and accept SDK licenses"
            Write-Info "  2. Ensure Java JDK is installed (Java 17 recommended)"
            Write-Info "  3. Check android/build.gradle for errors"
            exit 1
        }
    }
    else {
        Write-Warn "Skipping build (-SkipBuild flag set)"
    }
}

# Step 4: Start dev server (common for both platforms)
Write-Info "`nStep 4: Starting Expo dev server..."
Write-Success "Dev client is ready!"
Write-Info ""
Write-Info "Next steps:"
Write-Info "  1. The dev server will start below"
Write-Info "  2. Open the 'TrashCam' app on your device/simulator"
Write-Info "  3. It should auto-connect (or enter the URL manually)"
Write-Info "  4. DO NOT press 's' (that switches to Expo Go and causes SDK mismatch)"
Write-Info ""
Write-Warn "Press Ctrl+C to stop the dev server"
Write-Info ""

Start-Sleep -Seconds 2

if ($UseTunnel) {
    npx expo start --dev-client --tunnel --clear
}
else {
    npx expo start --dev-client --clear
}