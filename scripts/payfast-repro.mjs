#!/usr/bin/env node
/**
 * Replays the exact PayFast form POST the storefront makes (same fields, same
 * order, same signature as src/app/api/payments/payfast/initiate/route.ts) from
 * whatever network this script runs on.
 *
 * The point is to separate a gateway-side failure (PayFast edge / account) from
 * a payload or browser failure: run the identical body from Bangladesh and from
 * a South African egress and compare the HTTP status.
 *
 * Usage:
 *   node --env-file=.env.local scripts/payfast-repro.mjs --dry-run
 *   node --env-file=.env.local scripts/payfast-repro.mjs --send
 *   node --env-file=.env.local scripts/payfast-repro.mjs --send --repeat 3
 *   node --env-file=.env.local scripts/payfast-repro.mjs --send --proxy http://user:pass@host:port
 *   node scripts/payfast-repro.mjs --self-test
 *
 * --send is required to make a request. Even then nothing is charged: the
 * script only creates a PayFast payment session and stops. It never follows the
 * redirect or submits card details.
 *
 * Options:
 *   --send                 actually POST (default is a dry run)
 *   --print-body           print the full form body, including merchant_key
 *   --repeat N             post the same body N times (default 1)
 *   --mode live|sandbox    defaults to PAYFAST_MODE or live
 *   --amount 10.00         amount in rands (live minimum is R5.00)
 *   --name "Name Surname"
 *   --email you@example.com
 *   --payment-id <id>      m_payment_id; defaults to a fresh UUID shared by all attempts
 *   --order-number <ref>   custom_str1; defaults to REPRO-<timestamp>
 *   --item-name "Order ..."
 *   --proxy <url>          route the POST through a proxy (uses curl)
 *   --timeout <seconds>    default 60
 *   --save-response <file> write the raw response of each attempt
 *   --no-ip                skip the egress IP lookup
 *   --self-test            post the documented public sandbox credentials; a 302 proves the script works
 */

import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const PUBLIC_SANDBOX = {
  merchantId: '10000100',
  merchantKey: '46f0cd694581a',
  passphrase: 'jt7NOE43FZPn',
};

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function parseArgs(argv) {
  const out = { repeat: 1, timeout: 60 };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    switch (arg) {
      case '--send':
        out.send = true;
        break;
      case '--dry-run':
        out.send = false;
        break;
      case '--print-body':
        out.printBody = true;
        break;
      case '--self-test':
        out.selfTest = true;
        break;
      case '--no-ip':
        out.noIp = true;
        break;
      case '--repeat':
        out.repeat = Number(argv[++i] ?? '1');
        break;
      case '--mode':
        out.mode = argv[++i];
        break;
      case '--amount':
        out.amount = argv[++i];
        break;
      case '--name':
        out.name = argv[++i];
        break;
      case '--email':
        out.email = argv[++i];
        break;
      case '--payment-id':
        out.paymentId = argv[++i];
        break;
      case '--order-number':
        out.orderNumber = argv[++i];
        break;
      case '--item-name':
        out.itemName = argv[++i];
        break;
      case '--proxy':
        out.proxy = argv[++i];
        break;
      case '--timeout':
        out.timeout = Number(argv[++i] ?? '60');
        break;
      case '--save-response':
        out.saveResponse = argv[++i];
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return out;
}

// Mirrors PayFast's PHP urlencode(), as in src/lib/payments/payfast.ts.
function encode(value) {
  return encodeURIComponent(String(value))
    .replace(/[!'()*~]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, '+');
}

function generateSignature(fields, passphrase) {
  const pairs = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `${encode(key)}=${encode(String(value).trim())}`);

  if (passphrase?.trim()) {
    pairs.push(`passphrase=${encode(passphrase.trim())}`);
  }

  return createHash('md5').update(pairs.join('&')).digest('hex');
}

function addParams(baseUrl, params) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function getConfig(args) {
  if (args.selfTest) {
    return {
      mode: 'sandbox',
      merchantId: PUBLIC_SANDBOX.merchantId,
      merchantKey: PUBLIC_SANDBOX.merchantKey,
      passphrase: PUBLIC_SANDBOX.passphrase,
      returnUrl: 'https://example.com/order-confirmation',
      cancelUrl: 'https://example.com/checkout',
      notifyUrl: 'https://example.com/api/webhooks/payfast',
    };
  }

  const mode = (args.mode ?? process.env.PAYFAST_MODE ?? 'live').toLowerCase() === 'sandbox'
    ? 'sandbox'
    : 'live';

  const required = ['PAYFAST_MERCHANT_ID', 'PAYFAST_MERCHANT_KEY', 'PAYFAST_PASSPHRASE'];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    throw new Error(
      `Missing ${missing.join(', ')}. Run with --env-file=.env.local or set them in the environment.`
    );
  }

  return {
    mode,
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY,
    passphrase: process.env.PAYFAST_PASSPHRASE,
    returnUrl: process.env.PAYFAST_RETURN_URL ?? 'https://www.zhuafurniture.com/order-confirmation',
    cancelUrl: process.env.PAYFAST_CANCEL_URL ?? 'https://www.zhuafurniture.com/checkout',
    notifyUrl: process.env.PAYFAST_NOTIFY_URL ?? 'https://www.zhuafurniture.com/api/webhooks/payfast',
  };
}

function buildForm(args, config) {
  const paymentId = args.paymentId ?? `repro-${randomUUID()}`;
  const orderNumber = args.orderNumber ?? `REPRO-${Date.now().toString().slice(-6)}`;
  const [firstName, ...rest] = (args.name ?? 'Test Customer').trim().split(/\s+/);
  const lastName = rest.join(' ') || firstName;

  const callbackParams = { order: orderNumber, orderId: paymentId };

  const fields = {
    merchant_id: config.merchantId.trim(),
    merchant_key: config.merchantKey.trim(),
    return_url: addParams(config.returnUrl.trim(), callbackParams),
    cancel_url: addParams(config.cancelUrl.trim(), { payment: 'cancelled', ...callbackParams }),
    notify_url: config.notifyUrl.trim(),
    name_first: firstName,
    name_last: lastName,
    email_address: (args.email ?? 'test@example.com').trim(),
    m_payment_id: paymentId.trim(),
    amount: Number(args.amount ?? '10.00').toFixed(2),
    item_name: (args.itemName ?? `Order ${orderNumber}`).trim(),
    custom_str1: orderNumber,
  };

  const nonEmpty = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== '')
  );

  const signature = generateSignature(nonEmpty, config.passphrase);
  const bodyFields = { ...nonEmpty, signature };

  return {
    fields: bodyFields,
    body: new URLSearchParams(bodyFields).toString(),
    endpoint:
      config.mode === 'live'
        ? 'https://www.payfast.co.za/eng/process'
        : 'https://sandbox.payfast.co.za/eng/process',
  };
}

function redactBody(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => {
      if (key === 'merchant_key') return [key, `${value.slice(0, 4)}…(${value.length} chars)`];
      if (key === 'signature') return [key, `${value.slice(0, 8)}…`];
      return [key, value];
    })
  );
}

async function describeEgress() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
      signal: controller.signal,
    });
    const text = await res.text();
    const map = Object.fromEntries(
      text
        .trim()
        .split('\n')
        .map((line) => line.split('='))
        .filter((pair) => pair.length === 2)
    );

    return {
      ip: map.ip ?? 'unknown',
      country: map.loc ?? 'unknown',
      edge: map.colo ?? 'unknown',
    };
  } catch {
    return { ip: 'unavailable', country: 'unavailable', edge: 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}

function browserHeaders(paymentId) {
  return {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-ZA,en;q=0.9',
    Origin: 'https://www.zhuafurniture.com',
    Referer: 'https://www.zhuafurniture.com/checkout',
    'Upgrade-Insecure-Requests': '1',
    'X-Repro-Payment-Id': paymentId,
  };
}

async function postWithFetch(endpoint, body, headers, timeoutSeconds) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body,
    redirect: 'manual',
    signal: AbortSignal.timeout(timeoutSeconds * 1000),
  });

  return {
    status: res.status,
    location: res.headers.get('location') ?? '',
    server: res.headers.get('server') ?? '',
    contentType: res.headers.get('content-type') ?? '',
    body: await res.text(),
  };
}

function postWithCurl(endpoint, body, proxy, timeoutSeconds) {
  const result = spawnSync(
    'curl',
    [
      '-sS',
      '-i',
      '-X',
      'POST',
      endpoint,
      '-A',
      USER_AGENT,
      '-H',
      'Content-Type: application/x-www-form-urlencoded',
      '-H',
      'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      '-H',
      'Accept-Language: en-ZA,en;q=0.9',
      '-H',
      'Origin: https://www.zhuafurniture.com',
      '-H',
      'Referer: https://www.zhuafurniture.com/checkout',
      '--data-binary',
      '@-',
      '--proxy',
      proxy,
      '--max-time',
      String(timeoutSeconds),
    ],
    { input: body, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );

  if (result.error) {
    throw new Error(`curl failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`curl exited with ${result.status}: ${result.stderr.trim()}`);
  }

  const raw = result.stdout.replace(/\r\n/g, '\n');
  const splitAt = raw.indexOf('\n\n');
  const head = splitAt === -1 ? raw : raw.slice(0, splitAt);
  const responseBody = splitAt === -1 ? '' : raw.slice(splitAt + 2);

  const status = Number(head.match(/^HTTP\/[\d.]+ (\d{3})/)?.[1] ?? 0);
  const location = head.match(/^location:\s*(.+)$/im)?.[1]?.trim() ?? '';
  const server = head.match(/^server:\s*(.+)$/im)?.[1]?.trim() ?? '';

  return { status, location, server, contentType: '', body: responseBody };
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = getConfig(args);
  const form = buildForm(args, config);

  console.log(`\n=== PayFast repro (${config.mode}) ===`);
  console.log(`endpoint: ${form.endpoint}`);

  if (!args.noIp) {
    const egress = await describeEgress();
    console.log(
      `egress:   ip=${egress.ip} country=${egress.country} edge=${egress.edge}`
    );
  }

  console.log(`amount:   R ${form.fields.amount}`);
  console.log(`payer:    ${form.fields.name_first} ${form.fields.name_last} <${form.fields.email_address}>`);
  console.log(`payment:  ${form.fields.m_payment_id}`);

  if (!args.send) {
    console.log('\nDry run. Fields that would be posted:');
    console.log(JSON.stringify(redactBody(form.fields), null, 2));
    console.log('\nAdd --send to post this form. Add --print-body to print it in full.');
    if (args.printBody) {
      console.log(`\n${form.body}\n`);
    }
    return;
  }

  if (args.printBody) {
    console.log(`\nbody: ${form.body}\n`);
  }

  const headers = browserHeaders(form.fields.m_payment_id);
  const attempts = Math.max(1, Math.min(10, args.repeat));
  const responses = [];

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    console.log(`\n--- attempt ${attempt}/${attempts} ---`);

    let response;
    try {
      response =
        args.proxy
          ? postWithCurl(form.endpoint, form.body, args.proxy, args.timeout)
          : await postWithFetch(form.endpoint, form.body, headers, args.timeout);
    } catch (error) {
      console.log(`request failed: ${error instanceof Error ? error.message : String(error)}`);
      responses.push({ attempt, error: true });
      continue;
    }

    console.log(`HTTP ${response.status}${response.server ? ` (server: ${response.server})` : ''}`);
    if (response.location) {
      console.log(`location: ${response.location}`);
    }

    const preview = htmlToText(response.body).slice(0, 1200);
    if (preview) {
      console.log(`body: ${preview}`);
    }

    responses.push({ attempt, status: response.status, location: response.location });
  }

  if (args.saveResponse) {
    writeFileSync(args.saveResponse, JSON.stringify(responses, null, 2));
    console.log(`\nSaved response summary to ${args.saveResponse}`);
  }

  if (args.selfTest) {
    const ok = responses.some((entry) => entry.status === 302);
    console.log(`\nSelf-test ${ok ? 'PASSED' : 'FAILED'}: expected a 302 to /eng/process/payment/<uuid>.`);
    process.exitCode = ok ? 0 : 1;
  }
}

main().catch((error) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
