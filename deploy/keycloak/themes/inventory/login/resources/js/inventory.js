/* Shared display preferences; passwords and tokens are never persisted here. */
(() => {
  const cookies = Object.fromEntries(document.cookie.split(';').map(part => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }));
  document.documentElement.dataset.mode = cookies['inventory-mode'] === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.accent = cookies['inventory-accent'] === 'indigo' ? 'indigo' : 'forest';
  document.addEventListener('DOMContentLoaded', () => {
    const email = document.querySelector('input[name="email"]');
    if (email) { email.type = 'email'; email.autocomplete = 'email'; }
    document.querySelectorAll('[data-inventory-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        const input = document.getElementById(button.dataset.inventoryToggle);
        const showing = input.type === 'password';
        input.type = showing ? 'text' : 'password';
        button.textContent = showing ? button.dataset.hide : button.dataset.show;
        button.setAttribute('aria-label', button.textContent);
        button.setAttribute('aria-pressed', String(showing));
      });
    });
    const password = document.querySelector('input[autocomplete="new-password"]');
    const confirmation = document.getElementById('password-confirm');
    if (password && confirmation) {
      const validate = () => confirmation.setCustomValidity(confirmation.value && password.value !== confirmation.value
        ? (document.documentElement.lang.startsWith('tr') ? 'Şifreler eşleşmiyor.' : 'The passwords do not match.') : '');
      password.addEventListener('input', validate);
      confirmation.addEventListener('input', validate);
    }
    document.querySelectorAll('form').forEach(form => form.addEventListener('submit', () => {
      // Keep clicked submitter values (login, cancel-aia) included in the request.
      window.setTimeout(() => form.querySelectorAll('button[type="submit"],input[type="submit"]').forEach(button => { button.disabled = true; }), 0);
    }));
  });
})();
