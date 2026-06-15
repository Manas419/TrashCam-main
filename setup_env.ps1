<#
PowerShell helper to create a Python virtual environment and install requirements.
Usage examples (run in project root):
  # CPU-only PyTorch (default)
  .\setup_env.ps1 -cuda cpu

  # CUDA 11.8 (example)
  .\setup_env.ps1 -cuda cu118

Notes:
- Activating the venv inside a script affects only that script session. To work interactively, run the commands step-by-step in your terminal as shown in the README below.
- If you want a persistent activation in the current shell, instead run these commands manually (see README or the instructions printed by this script).
#>
param(
    [ValidateSet("cpu", "cu118", "cu117", "cu116", "cu115")]
    [string]$cuda = "cpu"
)

Write-Host "1) Checking Python availability..." -ForegroundColor Cyan
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Error "Python not found in PATH. Install Python 3.8+ and make sure 'python' is on PATH."; exit 1
}

Write-Host "2) Creating virtual environment in .venv..." -ForegroundColor Cyan
python -m venv .venv

Write-Host "3) Activating virtual environment (for this script session)..." -ForegroundColor Cyan
# Activate for this script. If you want the activation to persist in your interactive shell, run the Activate.ps1 line manually in your terminal.
. .\.venv\Scripts\Activate.ps1

Write-Host "4) Upgrading pip, setuptools, wheel..." -ForegroundColor Cyan
python -m pip install --upgrade pip setuptools wheel

Write-Host "5) Installing PyTorch (selected: $cuda)." -ForegroundColor Cyan
if ($cuda -eq 'cpu') {
    python -m pip install --index-url https://download.pytorch.org/whl/cpu torch torchvision --upgrade
}
else {
    # map simple label to wheel index - user may need to change depending on exact CUDA driver
    switch ($cuda) {
        'cu118' { $idx = 'https://download.pytorch.org/whl/cu118' }
        'cu117' { $idx = 'https://download.pytorch.org/whl/cu117' }
        'cu116' { $idx = 'https://download.pytorch.org/whl/cu116' }
        'cu115' { $idx = 'https://download.pytorch.org/whl/cu115' }
    }
    python -m pip install --index-url $idx torch torchvision --upgrade
}

Write-Host "6) Installing the rest of requirements from requirements_updated.txt..." -ForegroundColor Cyan
# Install requirements. If a binary build fails for 'lap' or other packages, consider installing Visual C++ Build Tools or using conda.
python -m pip install -r .\requirements_updated.txt

Write-Host 'Done. To start working interactively in this venv, run:' -ForegroundColor Green
Write-Host '  .\\.venv\\Scripts\\Activate.ps1' -ForegroundColor Yellow
Write-Host 'Then run: python -c "import torch; print(torch.__version__, torch.cuda.is_available())"' -ForegroundColor Yellow

Write-Host "If any package failed to build (lap, etc.), see the README or the printed errors and install the required build tools or use a conda environment." -ForegroundColor Magenta
