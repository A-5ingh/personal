// Health check / ping for API functions
import { jsonResponse } from './utils.js';

export async function onRequestGet(context) {
  return jsonResponse({ ok: true });
}
