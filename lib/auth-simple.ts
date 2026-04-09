// Simple authentication helpers for admin
// Uses sessionStorage for client-side auth check

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('admin_authenticated') === 'true';
}

export function setAdminAuthenticated(value: boolean) {
  if (typeof window === 'undefined') return;
  if (value) {
    sessionStorage.setItem('admin_authenticated', 'true');
  } else {
    sessionStorage.removeItem('admin_authenticated');
  }
}

export function logout() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('admin_authenticated');
}

// Made with Bob
