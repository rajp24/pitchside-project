function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let state = {
  authed: false,
  password: '',
  loginError: '',
  loggingIn: false,
  remaining: null, // null = not loaded yet
  remainingInput: '',
  saving: false,
  saveStatus: null, // { ok: boolean, message: string }
};

function setState(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  render();
}

async function fetchRemaining() {
  try {
    const res = await fetch('/api/batch');
    if (!res.ok) return;
    const data = await res.json();
    if (Number.isInteger(data.remaining)) {
      setState({ remaining: data.remaining, remainingInput: String(data.remaining) });
    }
  } catch {
    // leave remaining as-is; the panel shows "—" until this succeeds
  }
}

async function saveRemaining(next) {
  if (!Number.isInteger(next) || next < 0 || next > 999) {
    setState({ saveStatus: { ok: false, message: 'Enter a whole number between 0 and 999.' } });
    return;
  }
  setState({ saving: true, saveStatus: null });
  try {
    const res = await fetch('/api/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remaining: next }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setState({ saving: false, saveStatus: { ok: false, message: data.error || 'Save failed. Try again.' } });
      return;
    }
    const data = await res.json();
    setState({
      saving: false,
      remaining: data.remaining,
      remainingInput: String(data.remaining),
      saveStatus: { ok: true, message: 'Saved' },
    });
  } catch {
    setState({ saving: false, saveStatus: { ok: false, message: 'Save failed — check your connection.' } });
  }
}

function loginView() {
  return `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px">
    <div style="width:100%;max-width:360px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-family:'Archivo',sans-serif;font-weight:800;font-size:15px;letter-spacing:-.02em;text-transform:uppercase">Pitchside</div>
        <div style="font-family:'Archivo',sans-serif;font-weight:600;font-size:9.5px;letter-spacing:.34em;color:rgba(0,0,0,.45);text-transform:uppercase;margin-top:2px">Admin</div>
      </div>
      <form id="login-form" style="background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:14px">
        <div>
          <label style="display:block;font-size:12.5px;font-weight:500;margin-bottom:7px">Password</label>
          <input
            type="password"
            id="password-input"
            value="${esc(state.password)}"
            autofocus
            style="width:100%;box-sizing:border-box;padding:13px 12px;border:1px solid rgba(0,0,0,.14);border-radius:10px;font-size:14.5px"
          />
        </div>
        ${
          state.loginError
            ? `<div style="font-size:13px;color:#b3261e">${esc(state.loginError)}</div>`
            : ''
        }
        <button
          type="submit" class="btn-primary"
          ${state.loggingIn ? 'disabled' : ''}
          style="color:#fff;border:0;border-radius:11px;padding:16px;font-size:15px;font-weight:500;cursor:pointer;margin-top:4px;opacity:${state.loggingIn ? '.6' : '1'}"
        >${state.loggingIn ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <div style="text-align:center;margin-top:18px">
        <a href="/" style="font-size:13px;color:rgba(0,0,0,.5)">Go back home</a>
      </div>
    </div>
  </div>`;
}

function panelsView() {
  const remainingDisplay = state.remaining === null ? '—' : String(state.remaining);
  const atZero = state.remaining === 0;
  const statusHtml = state.saveStatus
    ? `<div style="margin-top:12px;font-size:13.5px;font-weight:500;color:${state.saveStatus.ok ? '#1f6b4f' : '#b3261e'}">${state.saveStatus.ok ? 'Saved ✓' : esc(state.saveStatus.message)}</div>`
    : '';

  return `
  <div style="min-height:100vh;display:flex;flex-direction:column">
    <header style="border-bottom:1px solid rgba(0,0,0,.08);padding:16px 32px;display:flex;align-items:center;justify-content:space-between">
      <div style="line-height:1">
        <div style="font-family:'Archivo',sans-serif;font-weight:800;font-size:15px;letter-spacing:-.02em;text-transform:uppercase">Pitchside</div>
        <div style="font-family:'Archivo',sans-serif;font-weight:600;font-size:9.5px;letter-spacing:.34em;color:rgba(0,0,0,.45);text-transform:uppercase">Admin</div>
      </div>
      <button id="logout-btn" style="background:none;border:1px solid rgba(0,0,0,.14);border-radius:999px;padding:9px 18px;font-size:13px;cursor:pointer">Log out</button>
    </header>

    <main style="flex:1;max-width:900px;margin:0 auto;padding:48px 32px;width:100%;box-sizing:border-box">
      <div class="admin-grid">
        <div style="background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:28px">
          <div style="font-family:'Archivo',sans-serif;font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(0,0,0,.45)">Batch</div>
          <div style="font-family:'Archivo',sans-serif;font-weight:800;font-size:72px;letter-spacing:-.03em;line-height:1;text-align:center;margin:28px 0">${remainingDisplay}</div>
          <button
            id="decrement-btn" class="btn-decrement"
            ${state.saving || atZero || state.remaining === null ? 'disabled' : ''}
            style="width:100%;color:#fff;border:0;border-radius:12px;padding:22px;font-size:19px;font-weight:700;cursor:pointer;opacity:${state.saving || atZero || state.remaining === null ? '.5' : '1'}"
          >−1</button>

          <div style="display:flex;gap:10px;margin-top:20px">
            <input
              id="remaining-input"
              type="number"
              min="0"
              max="999"
              step="1"
              value="${esc(state.remainingInput)}"
              style="flex:1;min-width:0;box-sizing:border-box;padding:11px 12px;border:1px solid rgba(0,0,0,.14);border-radius:10px;font-size:14.5px"
            />
            <button
              id="save-btn" class="btn-primary"
              ${state.saving ? 'disabled' : ''}
              style="color:#fff;border:0;border-radius:10px;padding:11px 18px;font-size:13.5px;font-weight:500;cursor:pointer;opacity:${state.saving ? '.6' : '1'}"
            >Save</button>
          </div>
          ${statusHtml}
        </div>

        <div style="background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:28px;display:flex;align-items:center;justify-content:center">
          <a
            href="https://dashboard.stripe.com/payments"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-primary"
            style="display:block;width:100%;text-align:center;color:#fff;border-radius:12px;padding:22px;font-family:'Archivo',sans-serif;font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:.06em"
          >Orders</a>
        </div>
      </div>
    </main>
  </div>`;
}

function render() {
  const app = document.getElementById('admin-app');
  app.innerHTML = state.authed ? panelsView() : loginView();
}

function bindEvents() {
  const app = document.getElementById('admin-app');

  app.addEventListener('submit', async (e) => {
    if (e.target.id !== 'login-form') return;
    e.preventDefault();
    if (state.loggingIn) return;
    const passwordInput = document.getElementById('password-input');
    const password = passwordInput ? passwordInput.value : '';
    setState({ loggingIn: true, loginError: '' });
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message =
          res.status === 429
            ? 'Too many attempts. Try again later.'
            : data.error || 'Incorrect password.';
        setState({ loggingIn: false, loginError: message });
        return;
      }
      setState({ authed: true, loggingIn: false, password: '', loginError: '' });
      fetchRemaining();
    } catch {
      setState({ loggingIn: false, loginError: 'Could not reach the server — check your connection.' });
    }
  });

  app.addEventListener('click', async (e) => {
    if (e.target.id === 'logout-btn') {
      try {
        await fetch('/api/logout', { method: 'POST' });
      } catch {
        // clearing local state regardless — the cookie will still expire on its own
      }
      setState({
        authed: false,
        remaining: null,
        remainingInput: '',
        saveStatus: null,
        loginError: '',
      });
      return;
    }

    if (e.target.id === 'decrement-btn') {
      if (state.remaining === null) return;
      saveRemaining(state.remaining - 1);
      return;
    }

    if (e.target.id === 'save-btn') {
      const input = document.getElementById('remaining-input');
      const next = input ? parseInt(input.value, 10) : NaN;
      saveRemaining(next);
    }
  });

  app.addEventListener('input', (e) => {
    if (e.target.id === 'password-input') {
      state.password = e.target.value;
    }
    if (e.target.id === 'remaining-input') {
      state.remainingInput = e.target.value;
    }
  });
}

function init() {
  bindEvents();
  render();
  fetchRemaining();
}

document.addEventListener('DOMContentLoaded', init);
