import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

const BASE_URL = "https://prospect-intel-backend-production.up.railway.app";
const EVENT_TYPES = ["Business Exit", "M&A Transaction", "IPO Liquidity", "Real Estate Sale", "Inheritance", "Other"];

let _token = null;

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

const API = {
  prospects: {
    list: () => api("/prospects/"),
    get: (id) => api(`/prospects/${id}`),
    timeline: (id) => api(`/prospects/${id}/timeline`),
  },
  triggers: {
    ingest: (payload) => api("/triggers/", { method: "POST", body: JSON.stringify(payload) }),
  },
  replies: {
    process: (payload) => api("/process_reply", { method: "POST", body: JSON.stringify(payload) }),
  },
  health: { check: () => api("/health") },
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0a0a0f; --ink-2: #111118; --ink-3: #1a1a24;
    --rule: #1e1e2e; --rule-2: #252535;
    --muted: #3a3a52; --dim: #5a5a7a; --mid: #8888aa; --soft: #c8c8dc; --paper: #eeeef8;
    --signal: #7c6af0; --signal-2: #9d8ff5; --signal-dim: #3d3470;
    --signal-glow: rgba(124,106,240,0.15); --signal-bg: rgba(124,106,240,0.06);
    --hot: #c0392b; --hot-bg: #1a0404; --hot-border: #4a1010;
    --warm-bg: #1a1400; --cold-bg: #040e1a; --green: #3a7a4a; --green-bg: #041008;
    --font-display: 'Playfair Display', Georgia, serif;
    --font-body: 'IBM Plex Sans', system-ui, sans-serif;
    --font-mono: 'IBM Plex Mono', 'Courier New', monospace;
  }
  html, body, #root { height: 100%; background: var(--ink); color: var(--soft); font-family: var(--font-body); }

  /* AUTH */
  .auth-shell { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .auth-card { width: 360px; }
  .auth-wordmark { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--dim); margin-bottom: 6px; }
  .auth-product { font-family: var(--font-display); font-size: 28px; font-weight: 600; color: var(--paper); letter-spacing: -0.02em; margin-bottom: 6px; }
  .auth-product span { color: var(--signal-2); }
  .auth-tagline { font-family: var(--font-body); font-size: 13px; color: var(--dim); line-height: 1.6; margin-bottom: 40px; }
  .auth-tabs { display: flex; border-bottom: 1px solid var(--rule); margin-bottom: 28px; }
  .auth-tab { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); padding: 10px 0; margin-right: 24px; cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.12s; }
  .auth-tab.active { color: var(--signal-2); border-bottom-color: var(--signal); }
  .auth-field { margin-bottom: 16px; }
  .auth-label { display: block; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--dim); margin-bottom: 6px; }
  .auth-input { width: 100%; background: var(--ink-2); border: 1px solid var(--rule-2); border-radius: 2px; color: var(--soft); font-family: var(--font-mono); font-size: 13px; padding: 11px 14px; outline: none; transition: border-color 0.12s; }
  .auth-input:focus { border-color: var(--signal-dim); box-shadow: 0 0 0 3px var(--signal-glow); }
  .auth-btn { width: 100%; background: var(--signal); color: #fff; border: none; border-radius: 2px; font-family: var(--font-body); font-size: 13px; font-weight: 600; padding: 12px; cursor: pointer; margin-top: 8px; transition: opacity 0.12s; }
  .auth-btn:hover:not(:disabled) { opacity: 0.88; }
  .auth-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .auth-error { background: var(--hot-bg); border: 1px solid var(--hot-border); border-radius: 2px; padding: 10px 12px; font-family: var(--font-mono); font-size: 11px; color: #d86a6a; margin-bottom: 14px; }
  .auth-success { background: var(--green-bg); border: 1px solid #1a4a1a; border-radius: 2px; padding: 10px 12px; font-family: var(--font-mono); font-size: 11px; color: #90d890; margin-bottom: 14px; }
  .auth-footer { margin-top: 32px; font-family: var(--font-mono); font-size: 9px; color: var(--muted); text-align: center; }

  /* ONBOARDING */
  .onboard-shell { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 40px 20px; }
  .onboard-card { width: 520px; }
  .onboard-eyebrow { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--signal-dim); margin-bottom: 8px; }
  .onboard-heading { font-family: var(--font-display); font-size: 26px; font-weight: 600; color: var(--paper); letter-spacing: -0.02em; margin-bottom: 10px; }
  .onboard-sub { font-family: var(--font-body); font-size: 13px; color: var(--dim); line-height: 1.7; margin-bottom: 36px; }
  .onboard-section-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--rule); }
  .onboard-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 28px; }
  .onboard-field { margin-bottom: 14px; }
  .onboard-label { display: block; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--dim); margin-bottom: 6px; }
  .onboard-input { width: 100%; background: var(--ink-2); border: 1px solid var(--rule-2); border-radius: 2px; color: var(--soft); font-family: var(--font-mono); font-size: 12px; padding: 10px 12px; outline: none; transition: border-color 0.12s; }
  .onboard-input:focus { border-color: var(--signal-dim); box-shadow: 0 0 0 3px var(--signal-glow); }
  .onboard-textarea { width: 100%; background: var(--ink-2); border: 1px solid var(--rule-2); border-radius: 2px; color: var(--soft); font-family: var(--font-mono); font-size: 12px; padding: 10px 12px; outline: none; resize: vertical; min-height: 130px; line-height: 1.6; transition: border-color 0.12s; margin-bottom: 10px; }
  .onboard-textarea:focus { border-color: var(--signal-dim); box-shadow: 0 0 0 3px var(--signal-glow); }
  .onboard-textarea::placeholder { color: var(--muted); }
  .onboard-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 32px; }
  .onboard-skip { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em; color: var(--dim); cursor: pointer; border: none; background: none; transition: color 0.12s; }
  .onboard-skip:hover { color: var(--soft); }
  .onboard-btn { background: var(--signal); color: #fff; border: none; border-radius: 2px; font-family: var(--font-body); font-size: 13px; font-weight: 600; padding: 11px 28px; cursor: pointer; transition: opacity 0.12s; }
  .onboard-btn:hover { opacity: 0.88; }
  .onboard-extract-btn { background: none; border: 1px solid var(--signal-dim); border-radius: 2px; color: var(--signal-2); font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 14px; cursor: pointer; transition: all 0.12s; }
  .onboard-extract-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .onboard-extract-btn:hover:not(:disabled) { background: var(--signal-bg); }
  .onboard-error { background: var(--hot-bg); border: 1px solid var(--hot-border); border-radius: 2px; padding: 10px 12px; font-family: var(--font-mono); font-size: 11px; color: #d86a6a; margin-bottom: 14px; }
  .style-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; margin-bottom: 10px; }
  .style-chip { display: inline-block; padding: 3px 10px; background: var(--signal-bg); border: 1px solid var(--signal-dim); border-radius: 2px; font-family: var(--font-mono); font-size: 9px; color: var(--signal-2); }

  /* MAIN APP */
  .shell { display: grid; grid-template-columns: 240px 1fr; height: 100vh; overflow: hidden; }
  .sidebar { background: var(--ink-2); border-right: 1px solid var(--rule); display: flex; flex-direction: column; overflow: hidden; }
  .sidebar-mark { padding: 24px 22px 18px; border-bottom: 1px solid var(--rule); }
  .sidebar-wordmark { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--dim); margin-bottom: 5px; }
  .sidebar-name { font-family: var(--font-display); font-size: 19px; font-weight: 600; color: var(--paper); letter-spacing: -0.02em; }
  .sidebar-name span { color: var(--signal-2); }
  .sidebar-nav { padding: 10px 0; flex: 1; overflow-y: auto; }
  .nav-section-label { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--muted); padding: 14px 22px 5px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 22px; font-family: var(--font-body); font-size: 13px; color: var(--dim); cursor: pointer; border: none; background: none; width: 100%; text-align: left; transition: color 0.12s, background 0.12s; border-left: 2px solid transparent; }
  .nav-item:hover { color: var(--soft); background: var(--ink-3); }
  .nav-item.active { color: var(--signal-2); border-left-color: var(--signal); background: var(--signal-bg); font-weight: 500; }
  .nav-icon { font-size: 13px; width: 16px; text-align: center; flex-shrink: 0; }
  .sidebar-footer { padding: 14px 22px; border-top: 1px solid var(--rule); }
  .sidebar-user { font-family: var(--font-mono); font-size: 10px; color: var(--dim); margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .status-row { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em; color: var(--dim); text-transform: uppercase; margin-bottom: 10px; }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); flex-shrink: 0; }
  .status-dot.live { background: var(--green); box-shadow: 0 0 6px var(--green); }
  .status-dot.err { background: var(--hot); }
  .signout-btn { width: 100%; background: none; border: 1px solid var(--rule-2); border-radius: 2px; color: var(--muted); font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 7px 0; cursor: pointer; transition: all 0.12s; }
  .signout-btn:hover { border-color: var(--dim); color: var(--soft); }
  .main { display: flex; flex-direction: column; overflow: hidden; }
  .topbar { display: flex; align-items: center; justify-content: space-between; padding: 0 32px; height: 52px; border-bottom: 1px solid var(--rule); flex-shrink: 0; background: var(--ink-2); }
  .topbar-left { display: flex; align-items: center; gap: 14px; }
  .back-btn { display: flex; align-items: center; gap: 6px; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; color: var(--dim); cursor: pointer; border: none; background: none; text-transform: uppercase; transition: color 0.12s; padding: 0; }
  .back-btn:hover { color: var(--soft); }
  .topbar-sep { color: var(--rule-2); font-size: 18px; }
  .topbar-title { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--mid); }
  .topbar-time { font-family: var(--font-mono); font-size: 10px; color: var(--muted); }
  .content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
  .content-padded { padding: 32px; }
  .content-full { height: 100%; }
  .page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; }
  .page-eyebrow { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--signal-dim); margin-bottom: 4px; }
  .page-heading { font-family: var(--font-display); font-size: 26px; font-weight: 600; color: var(--paper); letter-spacing: -0.02em; }
  .page-sub { font-family: var(--font-body); font-size: 12px; color: var(--dim); margin-top: 3px; }
  .filter-row { display: flex; gap: 8px; margin-bottom: 18px; }
  .filter-chip { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 10px; border-radius: 2px; border: 1px solid var(--rule-2); background: none; color: var(--dim); cursor: pointer; transition: all 0.12s; }
  .filter-chip:hover { border-color: var(--muted); color: var(--soft); }
  .filter-chip.active { border-color: var(--signal-dim); color: var(--signal-2); background: var(--signal-bg); }
  .prospects-table { width: 100%; border-collapse: collapse; }
  .prospects-table thead tr { border-bottom: 1px solid var(--rule); }
  .prospects-table th { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); padding: 0 0 10px; text-align: left; font-weight: 400; }
  .prospects-table td { padding: 14px 0; border-bottom: 1px solid var(--rule); vertical-align: middle; }
  .prospects-table tbody tr:hover td { background: var(--signal-bg); cursor: pointer; }
  .prospect-name { font-family: var(--font-body); font-size: 14px; font-weight: 500; color: var(--paper); }
  .prospect-sub { font-family: var(--font-mono); font-size: 10px; color: var(--dim); margin-top: 2px; }
  .pill { display: inline-block; padding: 3px 8px; border-radius: 2px; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; border: 1px solid; font-weight: 500; }
  .pill-hot { color: #ff9090; background: var(--hot-bg); border-color: var(--hot-border); }
  .pill-warm { color: #f0c060; background: var(--warm-bg); border-color: #4a3a00; }
  .pill-cold { color: #80b0d8; background: var(--cold-bg); border-color: #1a3a5a; }
  .pill-dead { color: var(--muted); background: var(--ink-3); border-color: var(--rule); }
  .pill-escalate { color: #ff9090; background: var(--hot-bg); border-color: var(--hot-border); }
  .pill-monitor { color: var(--signal-2); background: var(--signal-bg); border-color: var(--signal-dim); }
  .pill-continue { color: #90d890; background: var(--green-bg); border-color: #1a4a1a; }
  .pill-archive { color: var(--muted); background: var(--ink-3); border-color: var(--rule); }
  .conversation-layout { display: grid; grid-template-columns: 280px 1fr; height: 100%; overflow: hidden; }
  .conv-sidebar { border-right: 1px solid var(--rule); overflow-y: auto; background: var(--ink-2); }
  .conv-main { overflow-y: auto; padding: 28px 32px; }
  .prospect-card { padding: 20px; border-bottom: 1px solid var(--rule); }
  .prospect-card-name { font-family: var(--font-display); font-size: 17px; font-weight: 600; color: var(--paper); letter-spacing: -0.01em; margin-bottom: 3px; }
  .prospect-card-loc { font-family: var(--font-mono); font-size: 10px; color: var(--dim); margin-bottom: 12px; }
  .meta-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .meta-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
  .meta-value { font-family: var(--font-mono); font-size: 10px; color: var(--mid); }
  .timeline-section { padding: 16px 20px 0; }
  .timeline-section-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
  .timeline-item { display: flex; gap: 10px; padding-bottom: 16px; position: relative; }
  .timeline-item::before { content: ''; position: absolute; left: 5px; top: 14px; bottom: 0; width: 1px; background: var(--rule); }
  .timeline-item:last-child::before { display: none; }
  .timeline-dot { width: 11px; height: 11px; border-radius: 50%; border: 1px solid var(--muted); background: var(--ink-2); flex-shrink: 0; margin-top: 2px; position: relative; z-index: 1; }
  .timeline-dot.sent { border-color: var(--signal-dim); background: var(--signal-bg); }
  .timeline-dot.reply { border-color: #2c5f8a; background: var(--cold-bg); }
  .timeline-dot.escalated { border-color: var(--hot); background: var(--hot); }
  .timeline-event-type { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 2px; }
  .timeline-detail { font-family: var(--font-body); font-size: 11px; color: var(--mid); line-height: 1.5; }
  .timeline-ts { font-family: var(--font-mono); font-size: 9px; color: var(--muted); margin-top: 3px; }
  .email-subject { font-family: var(--font-body); font-size: 14px; font-weight: 600; color: var(--paper); margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--rule); }
  .email-display { font-family: var(--font-body); font-size: 13px; color: var(--mid); line-height: 1.8; white-space: pre-wrap; }
  .agent-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .agent-block { background: var(--ink-3); border: 1px solid var(--rule-2); border-radius: 2px; padding: 14px; }
  .agent-block-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .agent-block-value { font-family: var(--font-body); font-size: 12px; color: var(--soft); line-height: 1.6; }
  .confidence-bar { height: 3px; background: var(--ink-3); border-radius: 2px; margin-top: 6px; overflow: hidden; }
  .confidence-fill { height: 100%; background: var(--signal); border-radius: 2px; }
  .escalation-banner { background: var(--hot-bg); border: 1px solid var(--hot-border); border-radius: 3px; padding: 16px 18px; margin-bottom: 16px; }
  .escalation-title { font-family: var(--font-body); font-size: 13px; font-weight: 600; color: #ff9090; margin-bottom: 4px; }
  .escalation-body { font-family: var(--font-body); font-size: 12px; color: #994444; line-height: 1.6; }
  .reply-box { background: var(--ink-3); border: 1px solid var(--rule-2); border-radius: 2px; padding: 14px; margin-bottom: 12px; }
  .reply-box-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .reply-text-display { font-family: var(--font-body); font-size: 13px; color: var(--soft); line-height: 1.7; font-style: italic; }
  .interest-driver { display: inline-block; padding: 2px 7px; margin: 2px; background: var(--signal-bg); border: 1px solid var(--signal-dim); border-radius: 2px; font-family: var(--font-mono); font-size: 9px; color: var(--signal-2); }
  .inject-layout { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }
  .pipeline { display: flex; flex-direction: column; gap: 6px; }
  .pipeline-step { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--ink-2); border: 1px solid var(--rule); border-radius: 2px; }
  .step-indicator { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .step-pending { background: var(--ink-3); border: 1px solid var(--muted); }
  .step-running { background: var(--signal); animation: blink 1s infinite; }
  .step-done { background: var(--green); }
  .step-error { background: var(--hot); }
  @keyframes blink { 0%,100%{opacity:1;}50%{opacity:0.3;} }
  .step-label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--dim); flex: 1; }
  .step-label.active { color: var(--signal-2); }
  .step-label.done { color: var(--mid); }
  .step-status { font-family: var(--font-mono); font-size: 9px; color: var(--muted); }
  .section-card { background: var(--ink-2); border: 1px solid var(--rule); border-radius: 3px; margin-bottom: 16px; overflow: hidden; }
  .section-card-header { display: flex; align-items: center; justify-content: space-between; padding: 11px 16px; border-bottom: 1px solid var(--rule); }
  .section-card-title { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--dim); }
  .section-card-body { padding: 16px; }
  .form-group { margin-bottom: 18px; }
  .form-label { display: block; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--dim); margin-bottom: 6px; }
  .form-input, .form-select, .form-textarea { width: 100%; background: var(--ink-3); border: 1px solid var(--rule-2); border-radius: 2px; color: var(--soft); font-family: var(--font-mono); font-size: 12px; padding: 10px 12px; outline: none; transition: border-color 0.12s; }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--signal-dim); box-shadow: 0 0 0 3px var(--signal-glow); }
  .form-textarea { resize: vertical; min-height: 120px; line-height: 1.6; }
  .form-input::placeholder, .form-textarea::placeholder { color: var(--muted); opacity: 1; }
  .form-select { cursor: pointer; }
  option { background: var(--ink-3); }
  .btn-primary { background: var(--signal); color: #fff; border: none; border-radius: 2px; font-family: var(--font-body); font-size: 13px; font-weight: 600; padding: 11px 22px; cursor: pointer; width: 100%; transition: opacity 0.12s; }
  .btn-primary:hover:not(:disabled) { opacity: 0.9; }
  .btn-primary:disabled { opacity: 0.3; cursor: not-allowed; }
  .btn-secondary { background: none; color: var(--dim); border: 1px solid var(--rule-2); border-radius: 2px; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 14px; cursor: pointer; transition: all 0.12s; }
  .btn-secondary:hover { border-color: var(--muted); color: var(--soft); }
  .btn-inline { background: none; color: var(--signal-2); border: none; font-family: var(--font-mono); font-size: 10px; cursor: pointer; padding: 0; transition: opacity 0.12s; }
  .btn-inline:hover { opacity: 0.7; }
  .divider { height: 1px; background: var(--rule); margin: 20px 0; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .kv { margin-bottom: 10px; }
  .kv-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 3px; }
  .kv-value { font-family: var(--font-mono); font-size: 11px; color: var(--mid); word-break: break-all; }
  .kv-value.readable { font-family: var(--font-body); font-size: 12px; color: var(--soft); word-break: normal; }
  .loading { display: flex; align-items: center; justify-content: center; height: 200px; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); gap: 10px; }
  .loading::before { content:''; width:10px; height:10px; border-radius:50%; border:1px solid var(--muted); border-top-color:var(--signal); animation:spin 0.8s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg);} }
  .empty { display: flex; align-items: center; justify-content: center; height: 200px; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
  .error-msg { background: var(--hot-bg); border: 1px solid var(--hot-border); border-radius: 2px; padding: 12px 14px; font-family: var(--font-mono); font-size: 11px; color: #d86a6a; margin-bottom: 14px; }
  .success-msg { background: var(--green-bg); border: 1px solid #1a4a1a; border-radius: 2px; padding: 12px 14px; font-family: var(--font-mono); font-size: 11px; color: #90d890; margin-bottom: 14px; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--rule-2); border-radius: 2px; }
`;

function formatTs(ts) {
  if (!ts) return "—";
  try { return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return ts; }
}

function ClassificationPill({ value }) {
  if (!value) return null;
  const v = value.toLowerCase();
  const cls = v === "hot" ? "pill-hot" : v === "warm" ? "pill-warm" : v === "cold" ? "pill-cold" : "pill-dead";
  return <span className={`pill ${cls}`}>{value}</span>;
}

function PolicyPill({ value }) {
  if (!value) return null;
  if (value === "ESCALATE_TO_JOE") return <span className="pill pill-escalate">Escalate</span>;
  if (value === "AUTO_REPLY_ALLOWED") return <span className="pill pill-continue">Continue</span>;
  if (value === "MONITOR") return <span className="pill pill-monitor">Monitor</span>;
  return <span className="pill pill-archive">Archive</span>;
}

function timelineDotClass(step) {
  if (["outreach_created", "email_sent"].includes(step)) return "sent";
  if (["reply_received", "reply_classified"].includes(step)) return "reply";
  if (step === "escalation_fired") return "escalated";
  return "";
}

// Parse clean name from raw trigger text stored as prospect name
function parseName(raw) {
  if (!raw) return "Unknown";
  const match = raw.match(/Prospect Name:\s*([^\n\r,]+)/i);
  if (match) return match[1].trim();
  if (!raw.includes(":") && raw.length < 60) return raw;
  return raw.split(/[\n,]/)[0].replace(/prospect name/i, "").replace(/:/g, "").trim().slice(0, 40) || "Unknown";
}

// ── Auth Screen ──────────────────────────────────────────────────────────────

function AuthScreen() {
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSignIn = async () => {
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: "https://prospect-intel-frontend.vercel.app" } });
    if (error) setError(error.message);
    else { setTab("signin"); setSuccess("Account created. Check your email to verify, then sign in."); }
    setLoading(false);
  };

  const onKey = (e) => { if (e.key === "Enter") tab === "signin" ? handleSignIn() : handleSignUp(); };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-wordmark">Wealth Intelligence</div>
        <div className="auth-product">Prospect<span>Intel</span></div>
        <div className="auth-tagline">Liquidity event intelligence for private wealth advisors.</div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === "signin" ? "active" : ""}`} onClick={() => { setTab("signin"); setError(null); setSuccess(null); }}>Sign In</button>
          <button className={`auth-tab ${tab === "signup" ? "active" : ""}`} onClick={() => { setTab("signup"); setError(null); setSuccess(null); }}>Create Account</button>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <div className="auth-field">
          <label className="auth-label">Email</label>
          <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={onKey} placeholder="you@firm.com" autoFocus />
        </div>
        <div className="auth-field">
          <label className="auth-label">Password</label>
          <input className="auth-input" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={onKey} placeholder="••••••••" />
        </div>
        <button className="auth-btn" disabled={!email || !password || loading} onClick={tab === "signin" ? handleSignIn : handleSignUp}>
          {loading ? "Please wait…" : tab === "signin" ? "Sign In" : "Create Account"}
        </button>
        <div className="auth-footer">ProspectIntel · Private &amp; Confidential</div>
      </div>
    </div>
  );
}

// ── Onboarding Screen ────────────────────────────────────────────────────────

function OnboardingScreen({ userEmail, onComplete }) {
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [sample, setSample] = useState("");
  const [styleResult, setStyleResult] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState(null);

  const handleExtract = async () => {
    if (!sample.trim()) return;
    setExtracting(true); setError(null);
    try {
      const res = await api("/advisor/style", { method: "POST", body: JSON.stringify({ sample_text: sample.trim() }) });
      setStyleResult(res);
    } catch (e) { setError(e.message); }
    finally { setExtracting(false); }
  };

  const handleContinue = async () => {
    const resolvedName = name.trim() || userEmail.split("@")[0];
    try {
      await api("/advisor/profile", {
        method: "POST",
        body: JSON.stringify({ name: resolvedName, firm: firm.trim(), escalation_email: userEmail }),
      });
    } catch (e) {
      // non-blocking — continue even if save fails
    }
    onComplete({ name: resolvedName, firm: firm.trim(), email: userEmail, styleResult });
  };

  return (
    <div className="onboard-shell">
      <div className="onboard-card">
        <div className="onboard-eyebrow">Workspace Setup</div>
        <div className="onboard-heading">Configure your profile</div>
        <div className="onboard-sub">Enter your details and optionally paste a writing sample. ProspectIntel uses your style to generate outreach that sounds like you.</div>

        <div className="onboard-section-label">Your Profile</div>
        <div className="onboard-row">
          <div>
            <label className="onboard-label">Full Name</label>
            <input className="onboard-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="onboard-label">Firm</label>
            <input className="onboard-input" value={firm} onChange={e => setFirm(e.target.value)} placeholder="Firm name" />
          </div>
        </div>

        <div className="onboard-section-label" style={{ marginTop: 8 }}>Writing Style — Optional</div>
        {error && <div className="onboard-error">{error}</div>}
        <label className="onboard-label">Paste a sample email or message</label>
        <textarea
          className="onboard-textarea"
          placeholder="Paste an email or message you've written. The AI extracts your tone, vocabulary, and style so all outreach matches your voice exactly."
          value={sample}
          onChange={e => setSample(e.target.value)}
        />
        {!styleResult ? (
          <button className="onboard-extract-btn" disabled={!sample.trim() || extracting} onClick={handleExtract}>
            {extracting ? "Extracting…" : "Extract Style Profile"}
          </button>
        ) : (
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)" }}>Style Extracted</div>
            <div className="style-chips">
              {(styleResult.characteristics || []).map((c, i) => <span key={i} className="style-chip">{c}</span>)}
            </div>
            <button className="btn-inline" onClick={() => setStyleResult(null)}>Re-extract →</button>
          </div>
        )}

        <div className="onboard-actions">
          <button className="onboard-skip" onClick={handleContinue}>Skip and continue →</button>
          <button className="onboard-btn" onClick={handleContinue}>Enter ProspectIntel →</button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ page, onNavigate, apiStatus, userEmail, onSignOut }) {
  return (
    <div className="sidebar">
      <div className="sidebar-mark">
        <div className="sidebar-wordmark">Wealth Intelligence</div>
        <div className="sidebar-name">Prospect<span>Intel</span></div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Intelligence</div>
        <button className={`nav-item ${page === "prospects" ? "active" : ""}`} onClick={() => onNavigate("prospects")}>
          <span className="nav-icon">◈</span> Prospects
        </button>
        <button className={`nav-item ${page === "inject" ? "active" : ""}`} onClick={() => onNavigate("inject")}>
          <span className="nav-icon">⚡</span> Inject Event
        </button>
        <div className="nav-section-label">Account</div>
        <button className={`nav-item ${page === "settings" ? "active" : ""}`} onClick={() => onNavigate("settings")}>
          <span className="nav-icon">◎</span> Settings
        </button>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">{userEmail}</div>
        <div className="status-row">
          <div className={`status-dot ${apiStatus === "ok" ? "live" : apiStatus === "err" ? "err" : ""}`} />
          {apiStatus === "ok" ? "System Live" : apiStatus === "err" ? "API Unreachable" : "Checking…"}
        </div>
        <button className="signout-btn" onClick={onSignOut}>Sign Out</button>
      </div>
    </div>
  );
}

// ── TopBar ───────────────────────────────────────────────────────────────────

function TopBar({ page, selectedName, onBack }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const labels = { prospects: "Prospect Ledger", inject: "Event Injection", settings: "Settings" };
  return (
    <div className="topbar">
      <div className="topbar-left">
        {selectedName
          ? <><button className="back-btn" onClick={onBack}>← Back</button><span className="topbar-sep">|</span><span className="topbar-title">{selectedName}</span></>
          : <span className="topbar-title">{labels[page] || page}</span>}
      </div>
      <div className="topbar-right">
        <span className="topbar-time">{time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
      </div>
    </div>
  );
}

// ── Settings Page ────────────────────────────────────────────────────────────

function SettingsPage({ advisorProfile, onUpdate }) {
  const [name, setName] = useState(advisorProfile?.name || "");
  const [firm, setFirm] = useState(advisorProfile?.firm || "");
  const [escalationEmail, setEscalationEmail] = useState(advisorProfile?.escalationEmail || "");
  const [sample, setSample] = useState(advisorProfile?.sample || "");
  const [styleResult, setStyleResult] = useState(advisorProfile?.styleResult || null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleExtract = async () => {
    setExtracting(true); setError(null);
    try {
      const res = await api("/advisor/style", { method: "POST", body: JSON.stringify({ sample_text: sample.trim() }) });
      setStyleResult(res);
    } catch (e) { setError(e.message); }
    finally { setExtracting(false); }
  };

  const handleSave = async () => {
    try {
      await api("/advisor/profile", {
        method: "POST",
        body: JSON.stringify({ name, firm, escalation_email: escalationEmail }),
      });
      onUpdate({ name, firm, sample, styleResult, escalationEmail });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="content-padded">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Account</div>
          <div className="page-heading">Settings</div>
          <div className="page-sub">Update your profile and outreach style at any time.</div>
        </div>
      </div>
      {saved && <div className="success-msg">✓ Settings saved</div>}
      {error && <div className="error-msg">{error}</div>}
      <div className="section-card">
        <div className="section-card-header"><span className="section-card-title">Profile</span></div>
        <div className="section-card-body">
          <div className="two-col">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Firm</label>
              <input className="form-input" value={firm} onChange={e => setFirm(e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Escalation Alert Email</label>
            <input className="form-input" type="email" value={escalationEmail} onChange={e => setEscalationEmail(e.target.value)} placeholder="Email to receive HOT prospect alerts" />
          </div>
        </div>
      </div>
      <div className="section-card">
        <div className="section-card-header"><span className="section-card-title">Writing Style</span></div>
        <div className="section-card-body">
          <div className="form-group">
            <label className="form-label">Writing Sample</label>
            <textarea className="form-textarea" value={sample} onChange={e => setSample(e.target.value)} placeholder="Paste an email or message in your voice..." style={{ minHeight: 160 }} />
          </div>
          {styleResult && (
            <div style={{ marginBottom: 14 }}>
              <div className="kv-label" style={{ marginBottom: 8 }}>Extracted Characteristics</div>
              <div className="style-chips">
                {(styleResult.characteristics || []).map((c, i) => <span key={i} className="style-chip">{c}</span>)}
              </div>
            </div>
          )}
          <button className="btn-secondary" disabled={!sample.trim() || extracting} onClick={handleExtract} style={{ marginBottom: 16 }}>
            {extracting ? "Extracting…" : styleResult ? "Re-extract Style" : "Extract Style Profile"}
          </button>
        </div>
      </div>
      <button className="btn-primary" style={{ maxWidth: 200 }} onClick={handleSave}>Save Settings</button>
    </div>
  );
}

// ── Prospects Page ───────────────────────────────────────────────────────────

function ProspectsPage({ onSelect }) {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await API.prospects.list();
      setProspects(Array.isArray(data) ? data : data.prospects || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const filtered = filter === "all" ? prospects : prospects.filter(p => p.status === filter);

  return (
    <div className="content-padded">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Active Intelligence</div>
          <div className="page-heading">Prospect Ledger</div>
          <div className="page-sub">{prospects.length} prospect{prospects.length !== 1 ? "s" : ""} on record</div>
        </div>
        <button className="btn-secondary" onClick={load}>Refresh</button>
      </div>
      <div className="filter-row">
        {["all", "active", "escalated"].map(f => (
          <button key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      {loading && <div className="loading">Loading prospects</div>}
      {error && <div className="error-msg">{error}</div>}
      {!loading && !error && filtered.length === 0 && <div className="empty">No prospects found</div>}
      {!loading && !error && filtered.length > 0 && (
        <table className="prospects-table">
          <thead>
            <tr>
              <th>Prospect</th>
              <th>Trigger</th>
              <th>Classification</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const displayName = parseName(p.full_name);
              return (
                <tr key={p.id} onClick={() => onSelect(p.id, displayName)}>
                  <td>
                    <div className="prospect-name">{displayName}</div>
                    <div className="prospect-sub">{(p.location || "").split(".")[0]}</div>
                  </td>
                  <td><span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--mid)" }}>{p.latest_trigger?.event_type || "—"}</span></td>
                  <td><ClassificationPill value={p.latest_classification?.classification} /></td>
                  <td><span className={`pill ${p.status === "escalated" ? "pill-escalate" : "pill-monitor"}`}>{p.status}</span></td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>{formatTs(p.last_activity_at || p.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Conversation Page ────────────────────────────────────────────────────────

function ConversationPage({ prospectId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyResult, setReplyResult] = useState(null);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState(null);
  const [alertSent, setAlertSent] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [pd, td] = await Promise.all([API.prospects.get(prospectId), API.prospects.timeline(prospectId)]);
      setData({ ...pd, ...td });
    } catch (e) { if (!silent) setError(e.message); }
    finally { if (!silent) setLoading(false); }
  }, [prospectId]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(() => load(true), 5000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  const allOutreach = data?.outreach_messages || [];
  const latestOutreach = allOutreach[allOutreach.length - 1];
  const timeline = data?.timeline || [];
  const existingReplies = timeline.filter(e => e.step === "reply_received");
  const hasExistingReply = existingReplies.length > 0;
  const latestReply = hasExistingReply ? existingReplies[existingReplies.length - 1] : null;

  const handleProcessReply = async () => {
    if (!replyText.trim() || !latestOutreach) return;
    setReplyLoading(true); setReplyError(null); setAlertSent(false);
    try {
      const result = await API.replies.process({ prospect_id: prospectId, outreach_message_id: latestOutreach.id, reply_text: replyText.trim() });
      setReplyResult(result);
      if (result.policy_result?.decision === "ESCALATE_TO_JOE") setAlertSent(true);
      load();
    } catch (e) { setReplyError(e.message); }
    finally { setReplyLoading(false); }
  };

  if (loading) return <div className="loading">Loading conversation</div>;
  if (error) return <div style={{ padding: 24 }}><div className="error-msg">{error}</div></div>;
  if (!data) return null;

  const prospect = data.prospect || {};

  return (
    <div className="conversation-layout content-full">
      <div className="conv-sidebar">
        <div className="prospect-card">
          <div className="prospect-card-name">{parseName(prospect.full_name)}</div>
          <div className="prospect-card-loc">{(prospect.location || "").split(".")[0]}</div>
          <div className="meta-row"><span className="meta-label">ID</span><span className="meta-value" style={{ fontSize: 9 }}>{prospect.id?.slice(0, 8)}…</span></div>
          <div className="meta-row"><span className="meta-label">Created</span><span className="meta-value">{formatTs(prospect.created_at)}</span></div>
          {prospect.email && <div className="meta-row"><span className="meta-label">Email</span><span className="meta-value"><a href={`mailto:${prospect.email}`} style={{color:"var(--signal)",textDecoration:"none"}}>{prospect.email}</a></span></div>}
          {prospect.phone && <div className="meta-row"><span className="meta-label">Phone</span><span className="meta-value"><a href={`tel:${prospect.phone}`} style={{color:"var(--signal)",textDecoration:"none"}}>{prospect.phone}</a></span></div>}
          <div className="meta-row"><span className="meta-label">Outreach</span><span className="meta-value">{allOutreach.length} msg</span></div>
        </div>
        <div className="timeline-section">
          <div className="timeline-section-label">Timeline</div>
          {timeline.map((event, i) => (
            <div key={i} className="timeline-item">
              <div className={`timeline-dot ${timelineDotClass(event.step)}`} />
              <div>
                <div className="timeline-event-type">{(event.step || "").replace(/_/g, " ")}</div>
                <div className="timeline-detail">{event.detail}</div>
                <div className="timeline-ts">{formatTs(event.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="conv-main">
        {latestOutreach && (
          <div className="section-card">
            <div className="section-card-header">
              <span className="section-card-title">Outreach — Agent 1</span>
              <span className={`pill ${latestOutreach.delivery_status === "sent" ? "pill-continue" : "pill-archive"}`}>{latestOutreach.delivery_status}</span>
            </div>
            <div className="section-card-body">
              <div className="email-subject">{latestOutreach.subject}</div>
              <div className="email-display">{latestOutreach.body}</div>
              <div className="divider" />
              <div className="two-col">
                <div className="kv"><div className="kv-label">To</div><div className="kv-value">{latestOutreach.to_email || "—"}</div></div>
                <div className="kv"><div className="kv-label">Outreach ID</div><div className="kv-value">{latestOutreach.id?.slice(0, 16)}…</div></div>
              </div>
            </div>
          </div>
        )}

        {hasExistingReply && !replyResult && (
          <div className="section-card">
            <div className="section-card-header">
              <span className="section-card-title">Reply Intelligence — Agent 2 + 3</span>
              <ClassificationPill value={latestReply.classification} />
            </div>
            <div className="section-card-body">
              {latestReply.policy_decision === "ESCALATE_TO_JOE" && (
                <div className="escalation-banner">
                  <div className="escalation-title">Escalation Required</div>
                  <div className="escalation-body">{latestReply.next_action}</div>
                </div>
              )}
              <div className="reply-box">
                <div className="reply-box-label">Prospect Reply</div>
                <div className="reply-text-display">"{latestReply.reply_text}"</div>
              </div>
              <div className="agent-grid">
                <div className="agent-block">
                  <div className="agent-block-label">Agent 2 — Classification</div>
                  <div style={{ marginBottom: 8 }}><ClassificationPill value={latestReply.classification} /></div>
                  <div className="kv">
                    <div className="kv-label">Confidence</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--soft)" }}>{Math.round((latestReply.confidence || 0) * 100)}%</span>
                      <div className="confidence-bar" style={{ flex: 1 }}><div className="confidence-fill" style={{ width: `${(latestReply.confidence || 0) * 100}%` }} /></div>
                    </div>
                  </div>
                  <div className="kv"><div className="kv-label">Reasoning</div><div className="agent-block-value" style={{ fontSize: 11 }}>{latestReply.reasoning}</div></div>
                  <div className="kv"><div className="kv-label">Interest Drivers</div><div>{(latestReply.interest_drivers || []).map((d, i) => <span key={i} className="interest-driver">{d}</span>)}</div></div>
                </div>
                <div className="agent-block">
                  <div className="agent-block-label">Agent 3 — Next Action</div>
                  <div className="kv"><div className="kv-label">Action</div><div className="agent-block-value">{latestReply.next_action}</div></div>
                  <div className="kv"><div className="kv-label">Urgency</div><div className="agent-block-value" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{latestReply.urgency}</div></div>
                  <div className="kv"><div className="kv-label">Suggested Opening</div><div className="agent-block-value" style={{ fontSize: 11, fontStyle: "italic" }}>{latestReply.suggested_message}</div></div>
                </div>
                <div className="agent-block">
                  <div className="agent-block-label">Policy Engine</div>
                  <div className="kv"><div className="kv-label">Decision</div><PolicyPill value={latestReply.policy_decision} /></div>
                  <div className="kv"><div className="kv-label">Reason</div><div className="agent-block-value" style={{ fontSize: 11 }}>{latestReply.reason_detail}</div></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!hasExistingReply && (
          <div className="section-card">
            <div className="section-card-header">
              <span className="section-card-title">Reply Intelligence — Agent 2 + 3</span>
              {replyResult && <ClassificationPill value={replyResult.classification_result?.classification} />}
            </div>
            <div className="section-card-body">
              {!replyResult && (
                <>
                  {replyError && <div className="error-msg">{replyError}</div>}
                  <div className="form-group">
                    <label className="form-label">Simulate Prospect Reply</label>
                    <textarea className="form-textarea" placeholder="Paste prospect reply here..." value={replyText} onChange={e => setReplyText(e.target.value)} style={{ minHeight: 90 }} />
                  </div>
                  <button className="btn-primary" style={{ maxWidth: 200 }} disabled={!replyText.trim() || replyLoading || !latestOutreach} onClick={handleProcessReply}>
                    {replyLoading ? "Processing…" : "Process Reply"}
                  </button>
                </>
              )}
              {replyResult && (
                <>
                  {replyResult.policy_result?.decision === "ESCALATE_TO_JOE" && (
                    <div className="escalation-banner">
                      <div className="escalation-title">Escalation Required</div>
                      <div className="escalation-body">{replyResult.next_action?.action}{alertSent && <span style={{ marginLeft: 10, fontSize: 10 }}>· Alert sent</span>}</div>
                    </div>
                  )}
                  <div className="reply-box">
                    <div className="reply-box-label">Prospect Reply</div>
                    <div className="reply-text-display">"{replyText}"</div>
                  </div>
                  <div className="agent-grid">
                    <div className="agent-block">
                      <div className="agent-block-label">Agent 2 — Classification</div>
                      <div style={{ marginBottom: 8 }}><ClassificationPill value={replyResult.classification_result?.classification} /></div>
                      <div className="kv">
                        <div className="kv-label">Confidence</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--soft)" }}>{Math.round((replyResult.classification_result?.confidence || 0) * 100)}%</span>
                          <div className="confidence-bar" style={{ flex: 1 }}><div className="confidence-fill" style={{ width: `${(replyResult.classification_result?.confidence || 0) * 100}%` }} /></div>
                        </div>
                      </div>
                      <div className="kv"><div className="kv-label">Reasoning</div><div className="agent-block-value" style={{ fontSize: 11 }}>{replyResult.classification_result?.reasoning}</div></div>
                      <div className="kv"><div className="kv-label">Interest Drivers</div><div>{(replyResult.classification_result?.interest_drivers || []).map((d, i) => <span key={i} className="interest-driver">{d}</span>)}</div></div>
                    </div>
                    <div className="agent-block">
                      <div className="agent-block-label">Agent 3 — Next Action</div>
                      <div className="kv"><div className="kv-label">Action</div><div className="agent-block-value">{replyResult.next_action?.action}</div></div>
                      <div className="kv"><div className="kv-label">Urgency</div><div className="agent-block-value" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{replyResult.next_action?.urgency}</div></div>
                      <div className="kv"><div className="kv-label">Suggested Opening</div><div className="agent-block-value" style={{ fontSize: 11, fontStyle: "italic" }}>{replyResult.next_action?.suggested_message}</div></div>
                    </div>
                    <div className="agent-block">
                      <div className="agent-block-label">Policy Engine</div>
                      <div className="kv"><div className="kv-label">Decision</div><PolicyPill value={replyResult.policy_result?.decision} /></div>
                      <div className="kv"><div className="kv-label">Reason</div><div className="agent-block-value" style={{ fontSize: 11 }}>{replyResult.policy_result?.reason_detail}</div></div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <button className="btn-secondary" onClick={() => { setReplyResult(null); setReplyText(""); setAlertSent(false); }}>Process Another Reply</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inject Page ──────────────────────────────────────────────────────────────

const PIPELINE_STEPS = ["Event Received", "Trigger Saved", "Agent Analysis", "Outreach Generated", "Email Sent"];

function InjectPage({ onSuccess }) {
  const [rawText, setRawText] = useState("");
  const [eventType, setEventType] = useState("Business Exit");
  const [toEmail, setToEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleInject = async () => {
    if (!rawText.trim() || !toEmail.trim()) return;
    setLoading(true); setError(null); setResult(null); setActiveStep(0);
    try {
      await new Promise(r => setTimeout(r, 250)); setActiveStep(1);
      const data = await API.triggers.ingest({ raw_text: rawText.trim(), event_type: eventType, to_email: toEmail.trim(), auto_send: true });
      setActiveStep(2); await new Promise(r => setTimeout(r, 300));
      setActiveStep(3); await new Promise(r => setTimeout(r, 200));
      setActiveStep(4); setResult(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const samples = [
    { name: "Daniel Park", text: "Prospect Name: Daniel Park\nEmail: daniel.park@example.com\nLocation: New York NY\nEstimated Liquidity: $6200000\nNotes: Received $6.2M following IPO lockup expiration. Previously banked with JP Morgan private client.", type: "IPO Liquidity" },
    { name: "Sofia Reyes", text: "Prospect Name: Sofia Reyes\nEmail: sofia.reyes@example.com\nLocation: Miami FL\nEstimated Liquidity: $2800000\nNotes: Sold minority stake in family medical device company for $2.8M. No current wealth manager.", type: "Business Exit" },
    { name: "Marcus Webb", text: "Prospect Name: Marcus Webb\nEmail: marcus.webb@example.com\nLocation: Dallas TX\nEstimated Liquidity: $4700000\nNotes: Received $4.7M inheritance. Recently retired from corporate law, age 58. No current advisor.", type: "Inheritance" },
  ];

  return (
    <div className="content-padded">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Manual Injection</div>
          <div className="page-heading">Inject Trigger Event</div>
          <div className="page-sub">Push a liquidity event through the intelligence pipeline</div>
        </div>
      </div>
      <div className="inject-layout">
        <div>
          {error && <div className="error-msg">{error}</div>}
          <div className="section-card">
            <div className="section-card-header"><span className="section-card-title">Event Data</span></div>
            <div className="section-card-body">
              <div className="form-group">
                <label className="form-label">Raw Event Text</label>
                <textarea
                  className="form-textarea"
                  placeholder={"Prospect Name: First Last\nEmail: prospect@email.com\nLocation: City, State\nEstimated Liquidity: $5000000\nNotes: Additional context..."}
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  style={{ minHeight: 160 }}
                />
              </div>
              <div className="two-col">
                <div className="form-group">
                  <label className="form-label">Event Type</label>
                  <select className="form-select" value={eventType} onChange={e => setEventType(e.target.value)}>
                    {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Email</label>
                  <input className="form-input" value={toEmail} onChange={e => setToEmail(e.target.value)} placeholder="prospect@email.com" />
                </div>
              </div>
              <button className="btn-primary" disabled={loading || !rawText.trim() || !toEmail.trim()} onClick={handleInject}>
                {loading ? "Injecting…" : "Inject Event"}
              </button>
            </div>
          </div>
          {result && (
            <div className="section-card">
              <div className="section-card-header">
                <span className="section-card-title">Result</span>
                <span className={`pill ${result.outreach?.delivery_status === "sent" ? "pill-continue" : "pill-archive"}`}>{result.outreach?.delivery_status}</span>
              </div>
              <div className="section-card-body">
                <div className="kv"><div className="kv-label">Generated Subject</div><div className="kv-value readable">{result.outreach?.subject}</div></div>
                <div className="divider" />
                <button className="btn-secondary" onClick={() => onSuccess && onSuccess(result.trigger?.prospect_id, result.trigger?.prospect_id?.slice(0, 8))}>View Conversation →</button>
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="section-card">
            <div className="section-card-header"><span className="section-card-title">Pipeline Status</span></div>
            <div className="section-card-body">
              <div className="pipeline">
                {PIPELINE_STEPS.map((label, i) => {
                  const isDone = result && !loading;
                  const state = activeStep === -1 ? "pending" : isDone ? "done" : i < activeStep ? "done" : i === activeStep ? "running" : "pending";
                  return (
                    <div key={label} className="pipeline-step">
                      <div className={`step-indicator step-${error && i === activeStep ? "error" : state}`} />
                      <span className={`step-label ${state === "running" ? "active" : state === "done" ? "done" : ""}`}>{label}</span>
                      <span className="step-status">{state === "done" ? "✓" : state === "running" ? "…" : ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="section-card">
            <div className="section-card-header"><span className="section-card-title">Sample Triggers</span></div>
            <div className="section-card-body">
              {samples.map(s => (
                <div key={s.name} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--rule)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500, color: "var(--soft)" }}>{s.name}</span>
                    <button className="btn-secondary" style={{ fontSize: 9, padding: "3px 8px" }} onClick={() => { setRawText(s.text); setEventType(s.type); }}>Use</button>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)" }}>{s.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState(undefined);
  const [onboarded, setOnboarded] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [advisorProfile, setAdvisorProfile] = useState(null);
  const [page, setPage] = useState("prospects");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedName, setSelectedName] = useState(null);
  const [apiStatus, setApiStatus] = useState("checking");

  // On session load, fetch advisor profile from backend to restore state
  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const data = await api("/advisor/profile");
      if (data.exists && data.name) {
        setAdvisorProfile({ name: data.name, firm: data.firm, escalationEmail: data.escalation_email });
        setOnboarded(true);
      } else {
        setOnboarded(false);
        setAdvisorProfile(null);
      }
    } catch {
      setOnboarded(false);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) { _token = session.access_token; fetchProfile(); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      _token = session?.access_token || null;
      if (!session) { setOnboarded(false); setAdvisorProfile(null); }
      if (session) fetchProfile();
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) API.health.check().then(() => setApiStatus("ok")).catch(() => setApiStatus("err"));
  }, [session]);

  const handleSignOut = () => supabase.auth.signOut();
  const handleSelect = (id, name) => { setSelectedId(id); setSelectedName(name || id?.slice(0, 8)); };
  const handleBack = () => { setSelectedId(null); setSelectedName(null); };
  const handleOnboardComplete = (profile) => {
    setAdvisorProfile(profile);
    setOnboarded(true);
  };
  const handleNavigate = (p) => { handleBack(); setPage(p); };

  if (session === undefined || (session && profileLoading)) {
    return (
      <>
        <style>{styles}</style>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
          <div className="loading">Loading</div>
        </div>
      </>
    );
  }

  if (!session) return <><style>{styles}</style><AuthScreen /></>;

  if (!onboarded) return <><style>{styles}</style><OnboardingScreen userEmail={session.user.email} onComplete={handleOnboardComplete} /></>;

  return (
    <>
      <style>{styles}</style>
      <div className="shell">
        <Sidebar page={page} onNavigate={handleNavigate} apiStatus={apiStatus} userEmail={session.user.email} onSignOut={handleSignOut} />
        <div className="main">
          <TopBar page={page} selectedName={selectedName} onBack={handleBack} />
          <div className={`content ${selectedId ? "content-full" : ""}`}>
            {selectedId
              ? <ConversationPage prospectId={selectedId} />
              : page === "prospects" ? <ProspectsPage onSelect={handleSelect} />
              : page === "inject" ? <InjectPage onSuccess={handleSelect} />
              : page === "settings" ? <SettingsPage advisorProfile={advisorProfile} onUpdate={p => {
                const updated = { ...advisorProfile, ...p };
                setAdvisorProfile(updated);
              }} />
              : null}
          </div>
        </div>
      </div>
    </>
  );
}