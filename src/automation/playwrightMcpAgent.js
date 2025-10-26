import { chromium } from 'playwright';
import fs from 'fs';

export async function runAutomation({ id, filename, invoice }) {
  // This function launches Playwright, navigates to GST portal, and pauses for OTP entry.
  // It attempts to use an existing storageState if available to reuse login sessions.
  const GST_URL = process.env.GST_PORTAL_URL || 'https://www.gst.gov.in/';
  const storageStatePath = `./data/storageState.json`;
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: fs.existsSync(storageStatePath) ? JSON.parse(fs.readFileSync(storageStatePath)) : undefined });
  const page = await context.newPage();
  try {
    await page.goto(GST_URL, { waitUntil: 'networkidle' });
    // If not logged in, perform login and pause for OTP
    if (!await isLoggedIn(page)) {
      // navigate to login form - selector placeholders
      await page.click('text=Login');
      await page.waitForSelector('input[name="username"]', { timeout: 15000 });
      await page.fill('input[name="username"]', process.env.GST_USERNAME || '');
      await page.fill('input[name="password"]', process.env.GST_PASSWORD || '');
      // captcha handling skipped here - assume manual OTP step
      await page.click('button[type="submit"]');
      // Wait for OTP input to appear and pause the script to allow manual input
      console.log('Please enter OTP in browser. The worker will wait until you submit OTP and land on dashboard.');
      // Pause until user presses Enter in the terminal OR until dashboard detected
      await waitForDashboardOrManualConfirm(page);
      // save storage state for reuse
      const state = await context.storageState();
      fs.writeFileSync(storageStatePath, JSON.stringify(state));
    }

    // Now assume logged in. Navigate to GSTR-1 > Add Invoice
    // The selectors below are placeholders; replace with real portal selectors.
    await page.click('text=Services');
    await page.click('text=Returns');
    await page.click('text=GSTR-1');
    await page.waitForTimeout(2000);

    // Open B2B invoice entry - placeholder
    await page.click('text=Add Invoice');
    await page.waitForSelector('input[name="invoiceNo"]');

    // Fill simple fields
    await page.fill('input[name="invoiceNo"]', invoice.invoice_no || '');
    await page.fill('input[name="invoiceDate"]', invoice.invoice_date || '');
    await page.fill('input[name="supplierGstin"]', invoice.supplier_gstin || '');
    if (invoice.taxable_value_total) await page.fill('input[name="taxableValue"]', String(invoice.taxable_value_total));
    if (invoice.invoice_total) await page.fill('input[name="invoiceValue"]', String(invoice.invoice_total));

    // Save as draft
    await page.click('text=Save as Draft');
    await page.waitForTimeout(2000);

    // take screenshot
    const shotPath = `./data/shot-${id}.png`;
    await page.screenshot({ path: shotPath, fullPage: true });

    await browser.close();
    return { success: true, screenshot: shotPath };
  } catch (err) {
    await browser.close();
    return { success: false, error: err.message };
  }
}

async function isLoggedIn(page) {
  // crude check - replace with portal-specific check
  return Boolean(await page.$('text=Dashboard'));
}

async function waitForDashboardOrManualConfirm(page) {
  // Poll until Dashboard selector appears or user presses Enter in terminal
  const readline = await import('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    const check = async () => {
      if (await page.$('text=Dashboard')) {
        rl.close(); resolve(true); return;
      }
      setTimeout(check, 2000);
    };
    check();
    rl.question('Press ENTER after you have completed OTP in browser...', () => {
      rl.close(); resolve(true);
    });
  });
}
