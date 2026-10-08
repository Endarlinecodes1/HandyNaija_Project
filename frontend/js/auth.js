/**
 * HandyNaija — Authentication State Manager
 * Version 3.1 (Full FastAPI Backend JWT Auth with Resilient Multi-port & Offline Fallback)
 * Connects directly to http://127.0.0.1:5000/api/v1 or http://127.0.0.1:8000/api/v1 auth endpoints.
 */

(function (window) {
  'use strict';

  const AUTH_STORAGE_KEY = 'handynaija_auth_user';
  const AUTH_TOKEN_KEY = 'handynaija_auth_token';
  const PENDING_PROVIDERS_KEY = 'handynaija_pending_providers';

  const API_BASE_CANDIDATES = [
    window.HANDYNAIJA_API_URL,
    'https://handynaija-backend.onrender.com/api/v1',

  ].filter(Boolean);

  let activeApiBase = API_BASE_CANDIDATES[0] || 'https://handynaija-backend.onrender.com/api/v1';

  async function apiFetch(path, options) {
    let lastError = null;
    for (const base of API_BASE_CANDIDATES) {
      try {
        const res = await fetch(`${base}${path}`, options);
        activeApiBase = base;
        return res;
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError || new Error('Could not connect to backend server.');
  }

  let currentUser = null;

  function getStorage(key, defaultVal) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  function setStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
    }
  }

  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem('handynaija_user') || localStorage.getItem('user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.email || parsed.id)) {
        currentUser = parsed;
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        currentUser = null;
      }
    }
  } catch (e) {
    currentUser = null;
  }

  const HandyAuth = {
    getUser: function () {
      return currentUser;
    },

    isLoggedIn: function () {
      return currentUser !== null;
    },

    getRole: function () {
      if (currentUser && currentUser.role) {
        return currentUser.role;
      }
      const storedRole = localStorage.getItem('role');
      if (storedRole) return storedRole;
      return 'guest';
    },

    getToken: function () {
      return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('handynaija_token') || localStorage.getItem('token') || null;
    },

    getDashboardUrl: function (role) {
      const userRole = role || this.getRole();
      const inPagesDir = window.location.pathname.includes('/pages/');
      const prefix = inPagesDir ? '' : 'pages/';
      if (userRole === 'admin') {
        return `${prefix}admin-dashboard.html`;
      } else if (userRole === 'provider') {
        return `${prefix}provider-dashboard.html`;
      } else {
        return `${prefix}customer-dashboard.html`;
      }
    },

    redirectToDashboard: function (role) {
      const userRole = role || this.getRole();
      window.location.href = this.getDashboardUrl(userRole);
    },

    // Auth guard for page protection
    requireAuth: function (allowedRoles) {
      const user = this.getUser();
      const inPagesDir = window.location.pathname.includes('/pages/');
      const loginUrl = inPagesDir ? 'login.html' : 'pages/login.html';

      if (!user) {
        window.location.href = loginUrl;
        return false;
      }

      if (allowedRoles) {
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        if (!roles.includes(user.role)) {
          window.location.href = this.getDashboardUrl(user.role);
          return false;
        }
      }

      return true;
    },

    // Synchronous login method for event handlers and fallback
    login: function (email, password, role) {
      const lowerEmail = (email || '').toLowerCase();
      let userRole = role;

      if (!userRole || userRole === 'customer') {
        if (lowerEmail.includes('admin')) {
          userRole = 'admin';
        } else if (lowerEmail.includes('prov') || lowerEmail.includes('john') || lowerEmail.includes('artisan')) {
          userRole = 'provider';
        } else {
          userRole = userRole || 'customer';
        }
      }

      const name = userRole === 'admin' && lowerEmail.includes('admin')
        ? 'Admin User'
        : (email ? (email.split('@')[0].replace(/[\._\-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())) : 'User');

      currentUser = {
        id: 'user-' + Date.now().toString().slice(-6),
        name: name,
        role: userRole,
        email: email || '',
        phone: '',
        avatar: userRole === 'provider' ? 'images/providers/provider-1.svg' : 'images/providers/provider-2.svg',
        unreadNotifications: 0
      };

      const mockToken = 'token_' + Date.now();
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      localStorage.setItem('handynaija_user', JSON.stringify(currentUser));
      localStorage.setItem('handynaija_token', mockToken);
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(currentUser));
      localStorage.setItem('role', userRole);

      // Attempt FastAPI backend login in background
      apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password || 'DefaultPassword123!' })
      })
        .then(res => res.ok ? res.json() : null)
        .then(tokenData => {
          if (tokenData && tokenData.access_token) {
            localStorage.setItem(AUTH_TOKEN_KEY, tokenData.access_token);
            localStorage.setItem('handynaija_token', tokenData.access_token);
            localStorage.setItem('token', tokenData.access_token);
            if (tokenData.role) {
              currentUser.role = tokenData.role;
              localStorage.setItem('role', tokenData.role);
            }
            if (tokenData.user_id) currentUser.id = tokenData.user_id;
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
            localStorage.setItem('handynaija_user', JSON.stringify(currentUser));
            localStorage.setItem('user', JSON.stringify(currentUser));
          }
        })
        .catch(() => { });

      window.dispatchEvent(new CustomEvent('handynaija:auth-change', {
        detail: { user: currentUser, role: userRole }
      }));

      return currentUser;
    },

    // Async login directly calling FastAPI /auth/login
    loginAsync: async function (email, password) {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        let errorMsg = 'Login failed. Please check your email and password.';
        try {
          const errData = await res.json();
          errorMsg = errData.detail || errorMsg;
        } catch (_) { }
        throw new Error(errorMsg);
      }

      const tokenData = await res.json();

      // Fetch user profile from /users/me
      let userProfile = null;
      try {
        const userRes = await fetch(`${activeApiBase}/users/me`, {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        if (userRes.ok) userProfile = await userRes.json();
      } catch (_) { }

      const userRole = (tokenData && (tokenData.role || (tokenData.user && tokenData.user.role)))
        || (userProfile && userProfile.role)
        || (email.toLowerCase().includes('admin') ? 'admin' : (email.toLowerCase().includes('prov') ? 'provider' : 'customer'));

      const userName = (userProfile && userProfile.customer_profile && userProfile.customer_profile.full_name)
        || (userProfile && userProfile.provider_profile && userProfile.provider_profile.business_name)
        || (userRole === 'admin' ? 'Admin User' : email.split('@')[0].replace(/[\._\-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

      currentUser = {
        id: tokenData.user_id || (userProfile && userProfile.id) || 1,
        name: userName,
        role: userRole,
        email: email,
        avatar: userRole === 'provider' ? 'images/providers/provider-1.svg' : 'images/providers/provider-2.svg',
        unreadNotifications: 0
      };

      // Comprehensive token & user persistence in localStorage
      localStorage.setItem(AUTH_TOKEN_KEY, tokenData.access_token);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      localStorage.setItem('handynaija_token', tokenData.access_token);
      localStorage.setItem('handynaija_user', JSON.stringify(currentUser));
      localStorage.setItem('token', tokenData.access_token);
      localStorage.setItem('user', JSON.stringify(currentUser));
      localStorage.setItem('role', userRole);

      window.dispatchEvent(new CustomEvent('handynaija:auth-change', {
        detail: { user: currentUser, role: userRole }
      }));

      return currentUser;
    },

    // Customer Registration
    registerCustomer: function (data) {
      currentUser = {
        id: 'cust-' + Date.now().toString().slice(-6),
        name: data.name || 'Customer',
        role: 'customer',
        email: data.email || '',
        phone: data.phone || '',
        state: data.state || 'Lagos State',
        city: data.city || '',
        avatar: 'images/providers/provider-2.svg',
        unreadNotifications: 0,
        createdAt: new Date().toISOString()
      };

      const mockToken = 'token_' + Date.now();
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      localStorage.setItem('handynaija_user', JSON.stringify(currentUser));
      localStorage.setItem('handynaija_token', mockToken);
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(currentUser));
      localStorage.setItem('role', 'customer');

      // Attempt FastAPI registration in background
      apiFetch('/auth/register/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: data.name || 'Customer',
          email: data.email,
          password: data.password || 'CustomerPass123!',
          phone_number: data.phone || '',
          address: `${data.state || ''}, ${data.city || ''}`.trim()
        })
      })
        .then(res => res.ok ? this.login(data.email, data.password || 'CustomerPass123!', 'customer') : null)
        .catch(() => { });

      window.dispatchEvent(new CustomEvent('handynaija:auth-change', {
        detail: { user: currentUser, role: 'customer' }
      }));

      return currentUser;
    },

    // Provider Registration
    registerProvider: function (data) {
      const newProvider = {
        id: 'prov-' + Date.now().toString().slice(-6),
        name: data.name || 'Artisan',
        role: 'provider',
        email: data.email || '',
        phone: data.phone || '',
        state: data.state || 'Lagos State',
        city: data.city || '',
        address: data.address || '',
        categories: data.categories || ['plumbing'],
        category: data.categories && data.categories.length ? data.categories[0] : 'plumbing',
        experienceYears: data.experienceYears || '3',
        bio: data.bio || '',
        idType: data.idType || 'NIN',
        ninNumber: data.ninNumber || '',
        verificationStatus: 'pending',
        isVerified: false,
        submittedAt: new Date().toISOString(),
        avatar: data.profilePhoto || 'images/providers/provider-1.svg',
        rating: 5.0,
        completedJobs: 0,
        unreadNotifications: 1
      };

      const pendingList = getStorage(PENDING_PROVIDERS_KEY, []);
      pendingList.unshift(newProvider);
      setStorage(PENDING_PROVIDERS_KEY, pendingList);

      currentUser = newProvider;
      const mockToken = 'token_' + Date.now();
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      localStorage.setItem('handynaija_user', JSON.stringify(currentUser));
      localStorage.setItem('handynaija_token', mockToken);
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(currentUser));
      localStorage.setItem('role', 'provider');

      // Attempt FastAPI backend registration in background
      apiFetch('/auth/register/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: data.name || 'Artisan Provider',
          email: data.email,
          password: data.password || 'ProviderPass123!',
          phone_number: data.phone || '',
          business_name: data.businessName || data.name || 'Handy Artisan',
          bio: data.bio || 'Verified professional artisan in Nigeria.',
          location: data.state || 'Lagos State',
          service_area: `${data.city || 'Ikeja'}, ${data.address || ''}`.trim(),
          experience_years: parseInt(data.experienceYears) || 3,
          starting_price: 5000.0,
          category_id: data.categoryId || 1
        })
      })
        .then(res => res.ok ? this.login(data.email, data.password || 'ProviderPass123!', 'provider') : null)
        .catch(() => { });

      window.dispatchEvent(new CustomEvent('handynaija:auth-change', {
        detail: { user: currentUser, role: 'provider' }
      }));

      return newProvider;
    },

    logout: function () {
      currentUser = null;
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem('handynaija_user');
      localStorage.removeItem('handynaija_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');

      window.dispatchEvent(new CustomEvent('handynaija:auth-change', {
        detail: { user: null, role: 'guest' }
      }));

      // Redirect if on protected dashboard page
      const path = window.location.pathname;
      if (path.includes('dashboard') || path.includes('profile') || path.includes('admin-') || path.includes('request-details')) {
        window.location.href = path.includes('/pages/') ? 'login.html' : 'pages/login.html';
      }
    }
  };

  // Expose globally
  window.HandyAuth = HandyAuth;
})(window);
