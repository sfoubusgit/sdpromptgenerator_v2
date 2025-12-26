# GitHub Pages Deployment Guide

This guide explains how to deploy this project to GitHub Pages.

## Prerequisites

- A GitHub repository
- GitHub Pages enabled in your repository settings

## Quick Start

### Option 1: Automated Deployment (Recommended)

The project includes a GitHub Actions workflow that automatically builds and deploys your site when you push to the `main` or `master` branch.

1. **Enable GitHub Pages in your repository:**
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**

2. **Push your code:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

3. **Wait for the deployment:**
   - Go to the **Actions** tab in your repository
   - The workflow will automatically build and deploy your site
   - Once complete, your site will be available at:
     `https://[your-username].github.io/[repository-name]/`

### Option 2: Manual Deployment

If you prefer to deploy manually:

1. **Build the project with the correct base path:**
   ```bash
   # Replace 'repository-name' with your actual repository name
   BASE_PATH=/repository-name/ npm run build
   ```

2. **Deploy the `dist` folder:**
   - You can use the `gh-pages` package or manually copy the `dist` folder contents
   - If using `gh-pages`:
     ```bash
     npm install --save-dev gh-pages
     npx gh-pages -d dist
     ```

## Important Notes

### Base Path Configuration

The base path is automatically configured based on your repository name when using the GitHub Actions workflow. The workflow extracts your repository name and sets the `BASE_PATH` environment variable during build.

If you're deploying manually or to a custom domain:

- **For GitHub Pages with repository name in URL:** Use `/repository-name/` (with trailing slash)
- **For custom domain or root:** Use `/`

You can override the base path by setting the `BASE_PATH` environment variable:
```bash
BASE_PATH=/your-path/ npm run build
```

### Common Issues

#### Blank Screen After Deployment

If you see a blank screen after deployment, it's usually due to incorrect base path configuration:

1. **Check the browser console** for 404 errors on assets (CSS, JS files)
2. **Verify the base path** matches your repository name
3. **Check the built `index.html`** - asset paths should be relative to the base path

#### Assets Not Loading

If assets are not loading:

1. Ensure the `BASE_PATH` environment variable is set correctly during build
2. Check that all asset paths in the built `index.html` use the correct base path
3. Verify GitHub Pages is serving files from the correct directory (usually `dist` or root)

### Troubleshooting

1. **Clear browser cache** - Sometimes cached files cause issues
2. **Check GitHub Actions logs** - Look for build errors in the Actions tab
3. **Verify repository settings** - Ensure GitHub Pages is enabled and pointing to the correct source
4. **Test locally** - Use `npm run preview` after building to test the production build locally

## File Structure

The deployment setup includes:

- `.github/workflows/deploy.yml` - GitHub Actions workflow for automated deployment
- `vite.config.ts` - Vite configuration with base path support
- `.gitignore` - Excludes build artifacts and dependencies from version control

## Local Development

For local development, the base path defaults to `/`, so you can run:

```bash
npm run dev
```

This starts the development server at `http://localhost:5173` (or the port Vite assigns).

## Build for Production

To build for production:

```bash
npm run build
```

This creates an optimized build in the `dist` directory. The build will use the `BASE_PATH` environment variable if set, otherwise it defaults to `/`.

To test the production build locally:

```bash
npm run preview
```

