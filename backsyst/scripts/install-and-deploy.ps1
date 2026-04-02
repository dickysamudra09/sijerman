# Script untuk install dependencies dan push ke GitHub
# Jalankan: PowerShell -ExecutionPolicy Bypass -File .\scripts\install-and-deploy.ps1

Write-Host "=" * 60
Write-Host "Si Jerman - Build & Deploy Script"
Write-Host "=" * 60
Write-Host ""

# Step 1: Install dependencies
Write-Host "[STEP 1] Installing dependencies..." -ForegroundColor Cyan
Write-Host "Running: npm install"
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    Write-Host "Trying with legacy peer deps flag..."
    npm ci --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm ci failed! Please check your setup." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Run build (optional)
Write-Host "[STEP 2] Running build test..." -ForegroundColor Cyan
Write-Host "Running: npm run build"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Build failed. Check errors above." -ForegroundColor Yellow
    $buildContinue = Read-Host "Continue with git push anyway? (y/n)"
    if ($buildContinue -ne "y") {
        exit 1
    }
} else {
    Write-Host "✅ Build successful" -ForegroundColor Green
}
Write-Host ""

# Step 3: Git status
Write-Host "[STEP 3] Git status..." -ForegroundColor Cyan
git status
Write-Host ""

# Step 4: Stage all changes
Write-Host "[STEP 4] Staging all changes..." -ForegroundColor Cyan
Write-Host "Running: git add -A"
git add -A
Write-Host "✅ All changes staged" -ForegroundColor Green
Write-Host ""

# Step 5: Commit with message
Write-Host "[STEP 5] Creating commit..." -ForegroundColor Cyan
$commitMessage = Read-Host "Enter commit message (default: 'Install dnd-kit dependencies for drag-drop')"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Install dnd-kit dependencies for drag-drop"
}

Write-Host "Running: git commit -m '$commitMessage'"
git commit -m "$commitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Commit failed or no changes to commit" -ForegroundColor Yellow
    $continueAnyway = Read-Host "Continue with push anyway? (y/n)"
    if ($continueAnyway -ne "y") {
        exit 1
    }
} else {
    Write-Host "✅ Commit created successfully" -ForegroundColor Green
}
Write-Host ""

# Step 6: Get current branch
Write-Host "[STEP 6] Getting current branch..." -ForegroundColor Cyan
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow
Write-Host ""

# Step 7: Push to GitHub
Write-Host "[STEP 7] Pushing to GitHub..." -ForegroundColor Cyan
$pushConfirm = Read-Host "Push to origin/$currentBranch? (y/n)"
if ($pushConfirm -eq "y") {
    Write-Host "Running: git push origin $currentBranch"
    git push origin $currentBranch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "=" * 60
        Write-Host "Deployment initiated! Check Vercel for build status."
        Write-Host "=" * 60
    } else {
        Write-Host "❌ Push failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  Push cancelled" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done! ✅" -ForegroundColor Green
