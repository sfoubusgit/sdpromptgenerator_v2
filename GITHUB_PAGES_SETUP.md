# GitHub Pages Setup - Quick Reference

## What Was Fixed

The blank screen issue was caused by **incorrect base path configuration**. GitHub Pages serves your site at `https://username.github.io/repository-name/`, but the build was using absolute paths (`/assets/...`) instead of paths relative to the repository name (`/repository-name/assets/...`).

### Changes Made:

1. ✅ **Updated `vite.config.ts`** - Added base path support that reads from `BASE_PATH` environment variable
2. ✅ **Created `.gitignore`** - Excludes build artifacts and dependencies
3. ✅ **Created GitHub Actions workflow** - Automatically builds and deploys with correct base path
4. ✅ **Added `@types/node`** - Fixed TypeScript configuration
5. ✅ **Updated `tsconfig.json`** - Included vite.config.ts and Node.js types

## Deployment Steps

### First-Time Setup:

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add GitHub Pages deployment configuration"
   git push origin main  # or master
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
   - Save

3. **The workflow will automatically:**
   - Build your site with the correct base path (your repository name)
   - Deploy to GitHub Pages
   - Your site will be live at: `https://[your-username].github.io/[repository-name]/`

### After Setup:

Just push to `main` or `master` branch - the workflow will automatically deploy!

```bash
git push origin main
```

## Verification

To verify the build works correctly with a base path:

```bash
# Windows PowerShell
$env:BASE_PATH="/your-repo-name/"; npm run build

# Linux/Mac
BASE_PATH=/your-repo-name/ npm run build
```

Then check `dist/index.html` - the asset paths should include your repository name:
```html
<script src="/your-repo-name/assets/index-xxx.js"></script>
```

## Troubleshooting

### Still seeing a blank screen?

1. **Check the browser console** (F12) for 404 errors
2. **Verify GitHub Pages source** is set to "GitHub Actions" (not a branch)
3. **Check the Actions tab** - ensure the workflow completed successfully
4. **Clear browser cache** - hard refresh (Ctrl+F5 or Cmd+Shift+R)
5. **Verify the repository name** matches the URL path

### Build fails in GitHub Actions?

- Check the Actions tab for error messages
- Ensure `package.json` is committed
- Verify all dependencies are listed in `package.json`

## Files Added/Modified

- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `vite.config.ts` - Added base path configuration
- `.gitignore` - Excludes build artifacts
- `tsconfig.json` - Added Node.js types support
- `DEPLOYMENT.md` - Detailed deployment documentation
- `package.json` - Added @types/node dependency

## Need Help?

See `DEPLOYMENT.md` for more detailed information and troubleshooting steps.

