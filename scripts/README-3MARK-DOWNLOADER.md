# 3Mark PDF Downloader

This Playwright script automates the process of logging into 3mark.com and downloading all PDFs from the underwriting section.

## Prerequisites

1. **Install Playwright**:
   ```bash
   npm install -D playwright @playwright/test
   npx playwright install
   ```

2. **Install tsx** (if not already installed):
   ```bash
   npm install -D tsx
   ```

## Setup

1. **Set up credentials**:

   Add your 3mark.com credentials to `.env.local`:
   ```bash
   THREEMARK_USERNAME=your_username
   THREEMARK_PASSWORD=your_password
   ```

   Or export them as environment variables:
   ```bash
   # Windows (PowerShell)
   $env:THREEMARK_USERNAME="your_username"
   $env:THREEMARK_PASSWORD="your_password"

   # Windows (Command Prompt)
   set THREEMARK_USERNAME=your_username
   set THREEMARK_PASSWORD=your_password

   # Mac/Linux
   export THREEMARK_USERNAME="your_username"
   export THREEMARK_PASSWORD="your_password"
   ```

## Usage

Run the script:

```bash
npx tsx scripts/download-3mark-pdfs.ts
```

## What the Script Does

1. Launches a Chrome browser (visible by default for debugging)
2. Navigates to 3mark.com login page
3. Enters your credentials and logs in
4. Navigates to the underwriting section at:
   `https://3mark.com/login/3-mark-producer-home/underwriting-and-impaired-risk/`
5. Finds all PDF links matching the pattern:
   `https://libraip.com/syndicated/Underwriting%20Questionnaires/3Mark/Article`
6. Downloads each PDF to `downloads/3mark-pdfs/` directory
7. Displays a summary of successful/failed downloads

## Customization

### Run Headless

To run without showing the browser window, edit the script and change:

```typescript
const browser: Browser = await chromium.launch({
  headless: true,  // Change false to true
  downloadsPath: DOWNLOAD_DIR
});
```

### Change Download Location

Edit the `DOWNLOAD_DIR` constant in the script:

```typescript
const DOWNLOAD_DIR = path.join(process.cwd(), 'your', 'custom', 'path');
```

### Update Selectors

If the login form changes, you may need to update the selectors in the `login()` function:

```typescript
await page.fill('input[name="username"]', USERNAME!);
await page.fill('input[name="password"]', PASSWORD!);
```

To find the correct selectors:
1. Right-click on the input field in the browser
2. Select "Inspect"
3. Look for the `name`, `id`, or other attributes
4. Update the selector accordingly

## Troubleshooting

### "Missing credentials" error
Make sure you've set the `THREEMARK_USERNAME` and `THREEMARK_PASSWORD` environment variables.

### Login fails
- Check that your credentials are correct
- The login form selectors may have changed - inspect the page and update them
- Check if there's a CAPTCHA or 2FA that needs manual intervention

### PDFs not found
- The PDF link pattern may have changed - check the actual URLs on the page
- Update the `PDF_LINK_PATTERN` constant if needed

### Download fails
- Check your internet connection
- Some PDFs may be protected or require additional permissions
- Check the browser console for errors (run with `headless: false`)

## Output

PDFs will be saved to:
```
C:\dev\valor-2\downloads\3mark-pdfs\
```

Each PDF will retain its original filename from the server.

## Security Notes

- Never commit your `.env.local` file to git (it's already in `.gitignore`)
- Keep your credentials secure
- This script is for authorized use only - ensure you have permission to automate access to 3mark.com
- Respect rate limits and terms of service
