/**
 * HandyNaija — Authentication State Manager
 * Version 2.1 (Session Auth + Comprehensive Artisan Verification Pipeline)
 * Default state is Guest (no fake mock user).
 */

(function (window) {
  'use strict';

  const AUTH_STORAGE_KEY = 'handynaija_auth_user';
  const AUTH_TOKEN_KEY = 'handynaija_auth_token';
  const PENDING_PROVIDERS_KEY = 'handynaija_pending_providers';

  let currentUser = null;

  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean up legacy mock data
      if (parsed && parsed.id && !parsed.id.startsWith('cust-101') && !parsed.id.startsWith('prov-001') && !parsed.id.startsWith('admin-01')) {
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
      return currentUser ? currentUser.role : 'guest';
    },

    login: function (email, password, role = 'customer') {
      const name = email ? (email.split('@')[0].replace(/[\._\-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())) : 'User';
      currentUser = {
        id: 'user-' + Date.now().toString().slice(-6),
        name: name,
        role: role || 'customer',
        email: email || '',
        phone: '',
        avatar: role === 'provider' ? 'images/providers/provider-1.svg' : 'images/providers/provider-2.svg',
        unreadNotifications: 0
      };
      
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      localStorage.setItem(AUTH_TOKEN_KEY, 'token_' + Date.now());

      window.dispatchEvent(new CustomEvent('handynaija:auth-change', {
        detail: { user: currentUser, role: this.getRole() }
      }));

      return currentUser;
    },

    registerCustomer: function (data) {
      currentUser = {
        id: 'cust-' + Date.now().toString().slice(-6),
        name: data.name || 'Customer',
        role: 'customer',
        email: data.email || '',
        phone: data.phone || '',
        state: data.state || 'Lagos',
        city: data.city || '',
        avatar: 'images/providers/provider-2.svg',
        unreadNotifications: 0,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      localStorage.setItem(AUTH_TOKEN_KEY, 'token_' + Date.now());

      window.dispatchEvent(new CustomEvent('handynaija:auth-change', {
        detail: { user: currentUser, role: 'customer' }
      }));

      return currentUser;
    },

    registerProvider: function (data) {
      const newProvider = {
        id: 'prov-' + Date.now().toString().slice(-6),
        name: data.name || 'Artisan',
        role: 'provider',
        email: data.email || '',
        phone: data.phone || '',
        state: data.state || 'Lagos',
        city: data.city || '',
        address: data.address || '',
        categories: data.categories || ['plumbing'],
        category: data.categories && data.categories.length ? data.categories[0] : 'plumbing',
        experienceYears: data.experienceYears || '3',
        bio: data.bio || '',
        idType: data.idType || 'NIN',
        ninNumber: data.ninNumber || '',
        idPhotoFront: data.idPhotoFront || 'id_front_document.pdf',
        idPhotoBack: data.idPhotoBack || 'id_back_document.pdf',
        profilePhoto: data.profilePhoto || 'images/providers/provider-1.svg',
        cacDocument: data.cacDocument || '',
        guarantorName: data.guarantorName || '',
        guarantorPhone: data.guarantorPhone || '',
        backgroundConsent: true,
        verificationStatus: 'pending', // 'pending', 'verified', 'rejected'
        isVerified: false,
        submittedAt: new Date().toISOString(),
        avatar: data.profilePhoto || 'images/providers/provider-1.svg',
        rating: 5.0,
        completedJobs: 0,
        unreadNotifications: 1
      };

      // 1. Store in pending verification queue for Admin inspection
      try {
        let pending = JSON.parse(localStorage.getItem(PENDING_PROVIDERS_KEY) || '[]');
        pending.unshift(newProvider);
        localStorage.setItem(PENDING_PROVIDERS_KEY, JSON.stringify(pending));
      } catch (e) {
        console.warn('Could not update pending providers queue', e);
      }

      // 2. Also register as current session provider
      currentUser = newProvider;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      localStorage.setItem(AUTH_TOKEN_KEY, 'token_' + Date.now());

      window.dispatchEvent(new CustomEvent('handynaija:auth-change', {
        detail: { user: currentUser, role: 'provider' }
      }));

      return newProvider;
    },

    // Backward compatibility for standard register signature
    register: function (name, email, phone, password, role = 'customer') {
      if (role === 'provider') {
        return this.registerProvider({ name, email, phone });
      }
      return this.registerCustomer({ name, email, phone });
    },

    getPendingProviders: function () {
      try {
        return JSON.parse(localStorage.getItem(PENDING_PROVIDERS_KEY) || '[]');
      } catch (e) {
        return [];
      }
    },

    approveProviderVerification: function (providerId) {
      try {
        let pending = JSON.parse(localStorage.getItem(PENDING_PROVIDERS_KEY) || '[]');
        const idx = pending.findIndex(p => p.id === providerId);
        if (idx !== -1) {
          pending[idx].verificationStatus = 'verified';
          pending[idx].isVerified = true;
          localStorage.setItem(PENDING_PROVIDERS_KEY, JSON.stringify(pending));
        }
        if (currentUser && currentUser.id === providerId) {
          currentUser.verificationStatus = 'verified';
          currentUser.isVerified = true;
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
        }
        return true;
      } catch (e) {
        return false;
      }
    },

    logout: function () {
      currentUser = null;
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);

      window.dispatchEvent(new CustomEvent('handynaija:auth-change', {
        detail: { user: null, role: 'guest' }
      }));

      return null;
    }
  };

  window.HandyAuth = HandyAuth;
})(window);
