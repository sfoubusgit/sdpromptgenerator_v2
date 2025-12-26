@echo off
echo ========================================
echo Git Push Fix Script
echo ========================================
echo.
echo This script will help you push your code to GitHub.
echo.
echo Checking remote status...
git fetch origin
echo.
echo Remote has a different history than local.
echo.
echo Options:
echo 1. Merge remote changes (safest - preserves both)
echo 2. Force push (replaces remote with your local version)
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Merging remote changes...
    git pull origin main --allow-unrelated-histories --no-edit
    if %errorlevel%==0 (
        echo.
        echo Merge successful! Pushing to GitHub...
        git push origin main
    ) else (
        echo.
        echo Merge conflicts detected! Please resolve them manually.
        echo Run: git status
        echo Then: git push origin main
    )
) else if "%choice%"=="2" (
    echo.
    echo WARNING: This will overwrite the remote repository!
    set /p confirm="Type 'yes' to confirm: "
    if "!confirm!"=="yes" (
        echo.
        echo Force pushing...
        git push origin main --force
        echo.
        echo Done!
    ) else (
        echo Cancelled.
    )
) else (
    echo Invalid choice.
)
echo.
pause

