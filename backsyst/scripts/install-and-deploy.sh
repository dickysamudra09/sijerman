#!/bin/bash

# Script untuk install dependencies dan push ke GitHub
# Jalankan: bash ./scripts/install-and-deploy.sh

echo "================================================================"
echo "Si Jerman - Build & Deploy Script"
echo "================================================================"
echo ""

# Step 1: Install dependencies
echo -e "\033[36m[STEP 1] Installing dependencies...\033[0m"
echo "Running: npm install"
npm install

if [ $? -ne 0 ]; then
    echo -e "\033[31m❌ npm install failed!\033[0m"
    echo "Trying with legacy peer deps flag..."
    npm ci --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo -e "\033[31m❌ npm ci failed! Please check your setup.\033[0m"
        exit 1
    fi
fi

echo -e "\033[32m✅ Dependencies installed successfully\033[0m"
echo ""

# Step 2: Run build (optional)
echo -e "\033[36m[STEP 2] Running build test...\033[0m"
echo "Running: npm run build"
npm run build

if [ $? -ne 0 ]; then
    echo -e "\033[33m⚠️  Build failed. Check errors above.\033[0m"
    read -p "Continue with git push anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "\033[32m✅ Build successful\033[0m"
fi
echo ""

# Step 3: Git status
echo -e "\033[36m[STEP 3] Git status...\033[0m"
git status
echo ""

# Step 4: Stage all changes
echo -e "\033[36m[STEP 4] Staging all changes...\033[0m"
echo "Running: git add -A"
git add -A
echo -e "\033[32m✅ All changes staged\033[0m"
echo ""

# Step 5: Commit with message
echo -e "\033[36m[STEP 5] Creating commit...\033[0m"
read -p "Enter commit message (default: 'Install dnd-kit dependencies for drag-drop'): " commitMessage
if [ -z "$commitMessage" ]; then
    commitMessage="Install dnd-kit dependencies for drag-drop"
fi

echo "Running: git commit -m '$commitMessage'"
git commit -m "$commitMessage"

if [ $? -ne 0 ]; then
    echo -e "\033[33m⚠️  Commit failed or no changes to commit\033[0m"
    read -p "Continue with push anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "\033[32m✅ Commit created successfully\033[0m"
fi
echo ""

# Step 6: Get current branch
echo -e "\033[36m[STEP 6] Getting current branch...\033[0m"
currentBranch=$(git rev-parse --abbrev-ref HEAD)
echo -e "\033[33mCurrent branch: $currentBranch\033[0m"
echo ""

# Step 7: Push to GitHub
echo -e "\033[36m[STEP 7] Pushing to GitHub...\033[0m"
read -p "Push to origin/$currentBranch? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running: git push origin $currentBranch"
    git push origin $currentBranch
    
    if [ $? -eq 0 ]; then
        echo -e "\033[32m✅ Successfully pushed to GitHub!\033[0m"
        echo ""
        echo "================================================================"
        echo "Deployment initiated! Check Vercel for build status."
        echo "================================================================"
    else
        echo -e "\033[31m❌ Push failed!\033[0m"
        exit 1
    fi
else
    echo -e "\033[33m⏭️  Push cancelled\033[0m"
fi

echo ""
echo -e "\033[32mDone! ✅\033[0m"
