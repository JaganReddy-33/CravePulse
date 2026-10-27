import { describe, it, expect } from 'vitest';

export function checkRouteAccess({ user, targetRoute }) {
  if (!user) {
    return {
      allowed: false,
      redirectTo: `/login?returnTo=${encodeURIComponent(targetRoute)}`,
      reason: 'UNAUTHENTICATED',
    };
  }

  const role = user.role;

  if (targetRoute.startsWith('/admin') && role !== 'ADMIN') {
    return {
      allowed: false,
      redirectTo: '/',
      reason: 'FORBIDDEN_ROLE',
    };
  }

  if (targetRoute.startsWith('/partner') && role !== 'RESTAURANT_OWNER' && role !== 'ADMIN') {
    return {
      allowed: false,
      redirectTo: '/',
      reason: 'FORBIDDEN_ROLE',
    };
  }

  if (targetRoute.startsWith('/rider') && role !== 'RIDER' && role !== 'ADMIN') {
    return {
      allowed: false,
      redirectTo: '/',
      reason: 'FORBIDDEN_ROLE',
    };
  }

  return {
    allowed: true,
    redirectTo: null,
    reason: null,
  };
}

describe('Protected Routes & Authorization Matrix Tests', () => {
  it('redirects unauthenticated user to login while preserving returnTo parameter', () => {
    const access = checkRouteAccess({ user: null, targetRoute: '/checkout' });
    expect(access.allowed).toBe(false);
    expect(access.redirectTo).toBe('/login?returnTo=%2Fcheckout');
    expect(access.reason).toBe('UNAUTHENTICATED');
  });

  it('prevents CUSTOMER from accessing /admin dashboard', () => {
    const user = { id: 101, role: 'CUSTOMER', fullName: 'Ananya Sharma' };
    const access = checkRouteAccess({ user, targetRoute: '/admin/ops' });
    expect(access.allowed).toBe(false);
    expect(access.redirectTo).toBe('/');
    expect(access.reason).toBe('FORBIDDEN_ROLE');
  });

  it('prevents RIDER from accessing /partner kitchen kanban', () => {
    const user = { id: 201, role: 'RIDER', fullName: 'Karthik Rao' };
    const access = checkRouteAccess({ user, targetRoute: '/partner/kitchen' });
    expect(access.allowed).toBe(false);
    expect(access.redirectTo).toBe('/');
    expect(access.reason).toBe('FORBIDDEN_ROLE');
  });

  it('allows RESTAURANT_OWNER to access /partner routes', () => {
    const user = { id: 401, role: 'RESTAURANT_OWNER', fullName: 'Chef Partner' };
    const access = checkRouteAccess({ user, targetRoute: '/partner/menu' });
    expect(access.allowed).toBe(true);
    expect(access.redirectTo).toBeNull();
  });

  it('allows ADMIN to access /admin routes', () => {
    const user = { id: 301, role: 'ADMIN', fullName: 'Platform Ops Admin' };
    const access = checkRouteAccess({ user, targetRoute: '/admin/users' });
    expect(access.allowed).toBe(true);
    expect(access.redirectTo).toBeNull();
  });
});
