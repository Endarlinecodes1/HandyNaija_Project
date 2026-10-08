/**
 * HandyNaija — Unified API & Data Integration Layer
 * Version 3.0 (Full Backend FastAPI + SQLite/Postgres Integration with Resilient Offline Fallback)
 * Connects frontend directly to FastAPI REST backend (http://127.0.0.1:5000/api/v1).
 */

(function (window) {
  'use strict';

  // Base API endpoint (Configurable via window.HANDYNAIJA_API_URL)
  const API_BASE_URL = window.HANDYNAIJA_API_URL || 'https://handynaija-backend.onrender.com/api/v1';

  const STORAGE_KEYS = {
    PROVIDERS: 'handynaija_providers',
    SERVICES: 'handynaija_services',
    REQUESTS: 'handynaija_requests',
    MESSAGES: 'handynaija_messages',
    LOCATIONS: 'handynaija_locations',
    BACKEND_STATUS: 'handynaija_backend_online'
  };

  // Helper: LocalStorage getters and setters with error recovery
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

  // --- Initial Fallback Mock Data ---
  const INITIAL_SERVICES = [
    { id: 1, slug: 'plumbing', name: 'Plumbing & Pipe Fitting', icon: 'images/icons/plumbing.svg', description: 'Leak repairs, borehole pumps, bathroom & kitchen installations', providerCount: 48 },
    { id: 2, slug: 'electrical', name: 'Electrical & Solar', icon: 'images/icons/electrical.svg', description: 'Inverter setups, wiring, generator repairs & appliance repairs', providerCount: 64 },
    { id: 3, slug: 'cleaning', name: 'Cleaning & Fumigation', icon: 'images/icons/cleaning.svg', description: 'Deep residential cleaning, office cleaning & pest control', providerCount: 35 },
    { id: 4, slug: 'mechanic', name: 'Auto Mechanic & Diagnostics', icon: 'images/icons/mechanic.svg', description: 'Engine diagnostics, brake repairs, AC fix & roadside assistance', providerCount: 29 },
    { id: 5, slug: 'carpenter', name: 'Carpentry & Woodwork', icon: 'images/icons/carpenter.svg', description: 'Custom furniture, kitchen cabinets, roof repairs & door fittings', providerCount: 22 },
    { id: 6, slug: 'tutor', name: 'Home Tutoring & Lessons', icon: 'images/icons/tutor.svg', description: 'WAEC/JAMB prep, primary school home tutors, coding & music', providerCount: 41 },
    { id: 7, slug: 'technician', name: 'AC & Refrigeration Tech', icon: 'images/icons/technician.svg', description: 'Air conditioner servicing, gas refilling, freezer repairs', providerCount: 37 },
    { id: 8, slug: 'painter', name: 'Painting & POP Design', icon: 'images/icons/painter.svg', description: 'Interior & exterior painting, screeding, POP ceiling installation', providerCount: 19 }
  ];

  const ALL_NIGERIAN_STATES = (typeof window !== 'undefined' && window.NIGERIA_STATES) ? window.NIGERIA_STATES : [
    "Abia State", "Adamawa State", "Akwa Ibom State", "Anambra State", "Bauchi State", "Bayelsa State", "Benue State", "Borno State", "Cross River State", "Delta State", "Ebonyi State", "Edo State", "Ekiti State", "Enugu State", "Abuja (FCT)", "Gombe State", "Imo State", "Jigawa State", "Kaduna State", "Kano State", "Katsina State", "Kebbi State", "Kogi State", "Kwara State", "Lagos State", "Nasarawa State", "Niger State", "Ogun State", "Ondo State", "Osun State", "Oyo State", "Plateau State", "Rivers State", "Sokoto State", "Taraba State", "Yobe State", "Zamfara State"
  ];

  const INITIAL_LOCATIONS = ALL_NIGERIAN_STATES.map(st => {
    const getCities = (typeof window !== 'undefined' && window.getCitiesForState) ? window.getCitiesForState : (s => {
      const citiesMap = (typeof window !== 'undefined' && (window.STATE_CITIES || window.NIGERIA_CITIES)) || {};
      return citiesMap[s] || ['Central Area', 'Township', 'GRA'];
    });
    const cityNames = getCities(st);
    return {
      state: st,
      cities: cityNames.map(cn => ({
        name: cn,
        areas: ['Central Area', 'GRA', 'Township', 'Commercial Area', 'Main Road']
      }))
    };
  });

  const INITIAL_PROVIDERS = [
    {
      id: 1,
      name: 'John Plumbing Services',
      avatar: 'images/providers/provider-1.svg',
      category: 'plumbing',
      categoryName: 'Plumbing & Pipe Fitting',
      isVerified: true,
      rating: 4.8,
      reviewCount: 34,
      experienceYears: 8,
      state: 'Anambra State',
      city: 'Awka',
      area: 'Ifite / Aroma',
      phone: '+234 803 123 4567',
      bio: 'Expert residential and commercial plumbing repairs, water pump installations, and emergency leak fixes across Awka and environs.',
      services: ['Leak Repair', 'Pipe Installation', 'Water Heater', 'Borehole Maintenance', 'Bathroom Fitting'],
      startingRate: '₦5,000',
      availability: 'Mon - Sat: 8:00 AM - 6:00 PM',
      completedJobs: 84
    },
    {
      id: 2,
      name: 'Chidi Solar & Electricals',
      avatar: 'images/providers/provider-2.svg',
      category: 'electrical',
      categoryName: 'Electrical & Solar',
      isVerified: true,
      rating: 4.9,
      reviewCount: 52,
      experienceYears: 10,
      state: 'Lagos State',
      city: 'Ikeja',
      area: 'Allen Avenue / GRA',
      phone: '+234 802 987 6543',
      bio: 'Certified solar energy engineer and domestic electrician. Specializes in inverter setup, panel wiring, conduit installation, and diagnostics.',
      services: ['Solar Installation', 'Inverter Setup', 'Conduit Wiring', 'Distribution Board', 'Fault Finding'],
      startingRate: '₦8,000',
      availability: 'Mon - Sun: 7:30 AM - 7:00 PM',
      completedJobs: 130
    },
    {
      id: 3,
      name: 'Fatima Spotless Cleaning Pros',
      avatar: 'images/providers/provider-3.svg',
      category: 'cleaning',
      categoryName: 'Cleaning & Fumigation',
      isVerified: true,
      rating: 4.7,
      reviewCount: 29,
      experienceYears: 5,
      state: 'Abuja (FCT)',
      city: 'Abuja',
      area: 'Wuse 2 / Maitama',
      phone: '+234 814 555 7890',
      bio: 'Professional residential post-construction cleaning, office janitorial services, fumigation, and couch steam extraction.',
      services: ['Deep Home Cleaning', 'Post-Construction Cleaning', 'Fumigation & Pest Control', 'Office Janitorial', 'Upholstery Shampooing'],
      startingRate: '₦6,000',
      availability: 'Mon - Sat: 7:00 AM - 6:00 PM',
      completedJobs: 95
    },
    {
      id: 4,
      name: 'Emeka Auto Diagnostics & Mechanic',
      avatar: 'images/providers/provider-4.svg',
      category: 'mechanic',
      categoryName: 'Auto Mechanic & Diagnostics',
      isVerified: true,
      rating: 4.9,
      reviewCount: 47,
      experienceYears: 12,
      state: 'Oyo State',
      city: 'Ibadan',
      area: 'Ring Road / Dugbe',
      phone: '+234 809 111 2233',
      bio: 'Automotive technician specializing in Japanese & European vehicles. Computer OBD2 scanning, brake service, suspension, and mobile repairs.',
      services: ['Computer Diagnostics (OBD2)', 'Brake & Suspension', 'Engine Overhaul', 'AC Gas & Compressor', 'Mobile Breakdown Support'],
      startingRate: '₦7,500',
      availability: 'Mon - Sat: 8:00 AM - 6:30 PM',
      completedJobs: 162
    },
    {
      id: 5,
      name: 'Sani Custom Woodworks & Furniture',
      avatar: 'images/providers/provider-1.svg',
      category: 'carpenter',
      categoryName: 'Carpentry & Woodwork',
      isVerified: false,
      rating: 4.6,
      reviewCount: 21,
      experienceYears: 7,
      state: 'Kano State',
      city: 'Kano',
      area: 'Nassarawa / Bompai',
      phone: '+234 806 777 8899',
      bio: 'Custom fitted wardrobes, modern kitchen cabinets, hardwood door installations, roof truss construction, and luxury furniture restoration.',
      services: ['Kitchen Cabinetry', 'Wardrobes & Closets', 'Door Hanging & Locks', 'Roof Truss Repair', 'Wood Polishing'],
      startingRate: '₦10,000',
      availability: 'Mon - Sat: 8:30 AM - 5:30 PM',
      completedJobs: 42
    },
    {
      id: 6,
      name: 'Blessing Home Lessons & STEM Tutor',
      avatar: 'images/providers/provider-2.svg',
      category: 'tutor',
      categoryName: 'Home Tutoring & Lessons',
      isVerified: true,
      rating: 5.0,
      reviewCount: 18,
      experienceYears: 6,
      state: 'Rivers State',
      city: 'Port Harcourt',
      area: 'Peter Odili / GRA',
      phone: '+234 805 444 1122',
      bio: 'Specialized STEM lessons, Mathematics, Physics, English diction, and exam prep for WAEC, NECO, IGCSE, and JAMB.',
      services: ['JAMB/WAEC Prep', 'Primary Maths & English', 'Sciences (Phy/Chem)', 'Coding for Kids', 'Phonics & Diction'],
      startingRate: '₦15,000 / mo',
      availability: 'Mon - Sun: 3:00 PM - 7:00 PM',
      completedJobs: 58
    },
    {
      id: 7,
      name: 'Kool Breeze AC & Cooling',
      avatar: 'images/providers/provider-3.svg',
      category: 'technician',
      categoryName: 'AC & Refrigeration Tech',
      isVerified: true,
      rating: 4.8,
      reviewCount: 38,
      experienceYears: 9,
      state: 'Lagos State',
      city: 'Lekki',
      area: 'Phase 1 / Ikate',
      phone: '+234 807 888 9900',
      bio: 'Inverter AC installations, gas charging, industrial refrigerator repairs, and preventive servicing for homes & offices.',
      services: ['AC Gas Refill', 'Inverter AC Fix', 'Compressor Replacement', 'Deep Chemical Wash', 'Cold Room Service'],
      startingRate: '₦8,500',
      availability: 'Mon - Sat: 8:00 AM - 6:00 PM',
      completedJobs: 114
    },
    {
      id: 8,
      name: 'Segun Deluxe Painting & POP',
      avatar: 'images/providers/provider-4.svg',
      category: 'painter',
      categoryName: 'Painting & POP Design',
      isVerified: false,
      rating: 4.5,
      reviewCount: 14,
      experienceYears: 4,
      state: 'Oyo State',
      city: 'Ibadan',
      area: 'Bodija / Ring Road',
      phone: '+234 812 666 5544',
      bio: 'Modern interior wall finishing, washable paint applications, 3D wall panels, POP ceiling casting, and exterior coatings.',
      services: ['Interior Painting', 'Wall Screeding', 'POP Ceiling', 'Epoxy Flooring', 'Exterior Painting'],
      startingRate: '₦6,500',
      availability: 'Mon - Sat: 8:00 AM - 5:30 PM',
      completedJobs: 33
    }
  ];

  const INITIAL_REQUESTS = [
    {
      id: 'REQ-00124',
      serviceName: 'Plumbing Repair',
      category: 'plumbing',
      providerId: 1,
      providerName: 'John Plumbing Services',
      customerId: 1,
      customerName: 'Chris Okonkwo',
      customerPhone: '+234 803 *** 1234',
      location: 'Ifite Road, Awka, Anambra State',
      state: 'Anambra State',
      city: 'Awka',
      area: 'Ifite',
      description: 'Kitchen sink is leaking underneath the cabinet. Water pools on the floor whenever the tap is opened.',
      preferredDate: 'Saturday, 10:00 AM',
      status: 'accepted',
      createdAt: '2026-10-02 09:30',
      timeline: [
        { label: 'Submitted', done: true, time: 'Oct 2, 09:30 AM' },
        { label: 'Accepted', done: true, time: 'Oct 2, 10:15 AM' },
        { label: 'Scheduled', done: false, time: 'Pending' },
        { label: 'In Progress', done: false, time: 'Pending' },
        { label: 'Completed', done: false, time: 'Pending' }
      ]
    }
  ];

  const INITIAL_MESSAGES = [
    {
      id: 'conv-001',
      requestId: 'REQ-00124',
      providerId: 1,
      providerName: 'John Plumbing Services',
      providerAvatar: 'images/providers/provider-1.svg',
      customerName: 'Chris Okonkwo',
      lastMessage: 'Good morning! I have accepted your request. I will arrive with replacement PVC pipes at 10:00 AM.',
      lastMessageTime: '10:15 AM',
      unreadCount: 1,
      messages: [
        { sender: 'customer', text: 'Hello, please can you come with 1/2 inch PVC fitting joints?', time: '09:35 AM' },
        { sender: 'provider', text: 'Good morning! I have accepted your request. I will arrive with replacement PVC pipes at 10:00 AM.', time: '10:15 AM' }
      ]
    }
  ];

  // Helper to map backend provider object to frontend standard UI model
  function mapBackendProvider(p) {
    if (!p) return null;
    const catSlug = (p.services && p.services[0] && p.services[0].category) ? p.services[0].category.slug : 'plumbing';
    const catName = (p.services && p.services[0] && p.services[0].category) ? p.services[0].category.name : 'Plumbing & Pipe Fitting';
    const serviceList = (p.services && p.services.length > 0)
      ? p.services.map(s => s.description || (s.category && s.category.name) || 'Service')
      : ['General Artisan Services'];

    return {
      id: p.id,
      name: p.business_name || (p.user && p.user.full_name) || 'Handy Provider',
      avatar: (p.user && p.user.avatar_url) || (p.id % 2 === 0 ? 'images/providers/provider-2.svg' : 'images/providers/provider-1.svg'),
      category: catSlug,
      categoryName: catName,
      isVerified: Boolean(p.is_verified),
      rating: p.rating_avg || 5.0,
      reviewCount: p.review_count || 0,
      experienceYears: p.experience_years || 1,
      state: p.location || 'Lagos State',
      city: p.service_area ? p.service_area.split(',')[0].trim() : 'Ikeja',
      area: p.service_area || '',
      phone: (p.user && p.user.phone_number) || '+234 800 000 0000',
      bio: p.bio || '',
      services: serviceList,
      startingRate: p.starting_price ? `₦${Number(p.starting_price).toLocaleString()}` : '₦5,000',
      availability: p.availability_status ? 'Available for booking' : 'Busy',
      completedJobs: p.completed_jobs || 15
    };
  }

  // --- Unified Fetch Helper with Timeout & Auth Headers ---
  async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('handynaija_auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errDetail = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          errDetail = errData.detail || errDetail;
        } catch (_) { }
        throw new Error(errDetail);
      }

      const data = await response.json();
      window.isBackendConnected = true;
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Background check for backend connectivity
  async function checkBackendHealth() {
    try {
      const res = await fetch(`${API_BASE_URL.replace(/\/api\/v1$/, '')}/health`, { method: 'GET' });
      if (res.ok) {
        window.isBackendConnected = true;
      }
    } catch (e) {
      window.isBackendConnected = false;
    }
  }
  checkBackendHealth();

  // --- Public API Interface (Async with Synchronous Cached Fallbacks) ---
  const HandyAPI = {
    BASE_URL: API_BASE_URL,

    isOnline: function () {
      return Boolean(window.isBackendConnected);
    },

    // 1. Service Categories
    getServices: function () {
      // Return cached/local immediately for instant synchronous rendering
      const cached = getStorage(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);

      // Async sync from backend in background
      apiFetch('/categories/')
        .then(categories => {
          if (Array.isArray(categories) && categories.length > 0) {
            const mapped = categories.map(c => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              icon: c.icon_url || `images/icons/${c.slug}.svg`,
              description: c.description || '',
              providerCount: c.provider_count || 30
            }));
            setStorage(STORAGE_KEYS.SERVICES, mapped);
          }
        })
        .catch(() => { });

      return cached;
    },

    getServicesAsync: async function () {
      try {
        const categories = await apiFetch('/categories/');
        if (Array.isArray(categories) && categories.length > 0) {
          const mapped = categories.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            icon: c.icon_url || `images/icons/${c.slug}.svg`,
            description: c.description || '',
            providerCount: c.provider_count || 30
          }));
          setStorage(STORAGE_KEYS.SERVICES, mapped);
          return mapped;
        }
      } catch (e) { }
      return getStorage(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    },

    // 2. Locations (36 States + FCT Abuja & All Capital Cities)
    getLocations: function () {
      const states = (typeof window !== 'undefined' && window.NIGERIA_STATES) ? window.NIGERIA_STATES : ALL_NIGERIAN_STATES;
      const getCities = (typeof window !== 'undefined' && window.getCitiesForState) ? window.getCitiesForState : (s => {
        const citiesMap = (typeof window !== 'undefined' && (window.STATE_CITIES || window.NIGERIA_CITIES)) || {};
        return citiesMap[s] || ['Central Area', 'Township', 'GRA'];
      });

      const fullLocations = states.map(st => {
        const cityNames = getCities(st);
        return {
          state: st,
          cities: cityNames.map(cn => ({
            name: cn,
            areas: ['Central Area', 'GRA', 'Township', 'Commercial Area', 'Main Road']
          }))
        };
      });

      const stored = getStorage(STORAGE_KEYS.LOCATIONS, null);
      if (!stored || !Array.isArray(stored) || stored.length < 37) {
        setStorage(STORAGE_KEYS.LOCATIONS, fullLocations);
        return fullLocations;
      }
      return stored;
    },

    // 3. Providers Directory
    getProviders: function (filters = {}) {
      const providers = getStorage(STORAGE_KEYS.PROVIDERS, INITIAL_PROVIDERS);

      // Async sync from backend if online
      apiFetch('/providers/')
        .then(backendProviders => {
          if (Array.isArray(backendProviders) && backendProviders.length > 0) {
            const mapped = backendProviders.map(mapBackendProvider);
            setStorage(STORAGE_KEYS.PROVIDERS, mapped);
          }
        })
        .catch(() => { });

      // Filter local list
      return providers.filter(p => {
        if (filters.category && filters.category !== 'all' && p.category.toLowerCase() !== filters.category.toLowerCase()) {
          return false;
        }
        if (filters.state && filters.state !== 'all') {
          const normFilter = filters.state.replace(/\s+State$/i, '').trim().toLowerCase();
          const normProv = (p.state || '').replace(/\s+State$/i, '').trim().toLowerCase();
          if (normProv !== normFilter && !(p.state || '').toLowerCase().includes(normFilter)) {
            return false;
          }
        }
        if (filters.city && filters.city !== 'all' && p.city.toLowerCase() !== filters.city.toLowerCase()) {
          return false;
        }
        if (filters.area && filters.area !== 'all' && !p.area.toLowerCase().includes(filters.area.toLowerCase())) {
          return false;
        }
        if (filters.query) {
          const q = filters.query.toLowerCase().trim();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBio = (p.bio || '').toLowerCase().includes(q);
          const matchServices = Array.isArray(p.services) && p.services.some(s => s.toLowerCase().includes(q));
          if (!matchName && !matchBio && !matchServices) return false;
        }
        return true;
      });
    },

    getProvidersAsync: async function (filters = {}) {
      try {
        const queryParams = new URLSearchParams();
        if (filters.state && filters.state !== 'all') queryParams.append('location', filters.state);
        if (filters.query) queryParams.append('search', filters.query);
        if (filters.min_rating && filters.min_rating !== 'all') queryParams.append('min_rating', filters.min_rating);

        const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const data = await apiFetch(`/providers/${qs}`);
        if (Array.isArray(data) && data.length > 0) {
          return data.map(mapBackendProvider);
        }
      } catch (e) { }
      return this.getProviders(filters);
    },

    getProviderById: function (id) {
      const providers = getStorage(STORAGE_KEYS.PROVIDERS, INITIAL_PROVIDERS);
      const strId = String(id).replace(/^prov-/, '');
      return providers.find(p => String(p.id) === String(id) || String(p.id) === strId) || null;
    },

    getProviderByIdAsync: async function (id) {
      const numId = parseInt(String(id).replace(/^prov-/, ''), 10);
      if (!isNaN(numId)) {
        try {
          const data = await apiFetch(`/providers/${numId}`);
          if (data) return mapBackendProvider(data);
        } catch (e) { }
      }
      return this.getProviderById(id);
    },

    // 4. Service Requests
    getRequests: function () {
      return getStorage(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
    },

    getRequestsAsync: async function () {
      try {
        const data = await apiFetch('/requests/');
        if (Array.isArray(data)) {
          const mapped = data.map(r => ({
            id: `REQ-${String(r.id).padStart(5, '0')}`,
            serviceName: r.job_description.slice(0, 30),
            category: r.category ? r.category.slug : 'general',
            providerId: r.provider_id,
            providerName: (r.provider && r.provider.business_name) || 'Assigned Artisan',
            customerId: r.customer_id,
            customerName: (r.customer && r.customer.full_name) || 'Customer',
            customerPhone: (r.customer && r.customer.phone_number) || '',
            location: r.service_location,
            state: r.service_location.split(',').pop()?.trim() || 'Nigeria',
            city: r.service_location.split(',')[0]?.trim() || '',
            area: r.service_location,
            description: r.job_description,
            preferredDate: r.preferred_datetime ? new Date(r.preferred_datetime).toLocaleString() : 'Flexible',
            status: r.status,
            createdAt: r.created_at ? new Date(r.created_at).toLocaleString() : 'Recent',
            timeline: [
              { label: 'Submitted', done: true, time: 'Done' },
              { label: 'Accepted', done: ['accepted', 'confirmed', 'in_progress', 'completed'].includes(r.status), time: r.status },
              { label: 'In Progress', done: ['in_progress', 'completed'].includes(r.status), time: '' },
              { label: 'Completed', done: r.status === 'completed', time: '' }
            ]
          }));
          setStorage(STORAGE_KEYS.REQUESTS, mapped);
          return mapped;
        }
      } catch (e) { }
      return getStorage(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
    },

    createRequest: function (data) {
      const requests = getStorage(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
      const newId = 'REQ-00' + (124 + requests.length);
      const newRequest = {
        id: newId,
        serviceName: data.serviceName || 'Custom Service',
        category: data.category || 'general',
        providerId: data.providerId || 1,
        providerName: data.providerName || 'Local Provider',
        customerId: data.customerId || 1,
        customerName: data.customerName || 'Customer',
        customerPhone: data.customerPhone || '+234 800 000 0000',
        location: `${data.area || ''}, ${data.city || ''}, ${data.state || ''}`.replace(/^,\s*|,\s*$/g, ''),
        state: data.state || 'Lagos State',
        city: data.city || 'Ikeja',
        area: data.area || '',
        description: data.description || '',
        preferredDate: `${data.date || 'Flexible'} at ${data.time || 'Convenient time'}`,
        status: 'pending',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        timeline: [
          { label: 'Submitted', done: true, time: 'Just now' },
          { label: 'Accepted', done: false, time: 'Pending' },
          { label: 'Scheduled', done: false, time: 'Pending' },
          { label: 'In Progress', done: false, time: 'Pending' },
          { label: 'Completed', done: false, time: 'Pending' }
        ]
      };

      requests.unshift(newRequest);
      setStorage(STORAGE_KEYS.REQUESTS, requests);

      // Async create in backend
      const provIdNum = parseInt(String(data.providerId || '1').replace(/^prov-/, ''), 10) || 1;
      apiFetch('/requests/', {
        method: 'POST',
        body: JSON.stringify({
          job_description: data.description || 'Request for service repair in Nigeria',
          service_location: newRequest.location,
          provider_id: provIdNum,
          category_id: data.categoryId || 1
        })
      }).catch(() => { });

      return newRequest;
    },

    updateRequestStatus: function (requestId, newStatus) {
      const requests = getStorage(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
      const index = requests.findIndex(r => r.id === requestId);
      if (index !== -1) {
        requests[index].status = newStatus;
        const statusOrder = ['pending', 'accepted', 'scheduled', 'inprogress', 'completed'];
        const currentRank = statusOrder.indexOf(newStatus);

        requests[index].timeline.forEach((step, idx) => {
          if (idx <= currentRank + 1) {
            step.done = true;
            step.time = step.time === 'Pending' ? 'Updated' : step.time;
          } else {
            step.done = false;
          }
        });

        setStorage(STORAGE_KEYS.REQUESTS, requests);

        // Async update in backend
        const numId = parseInt(String(requestId).replace(/\D/g, ''), 10);
        if (!isNaN(numId)) {
          apiFetch(`/requests/${numId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
          }).catch(() => { });
        }

        return requests[index];
      }
      return null;
    },

    // 5. Messages & Live Chat
    getConversations: function () {
      return getStorage(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    },

    sendMessage: function (conversationId, text, sender = 'customer') {
      const conversations = getStorage(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        conv.messages.push({
          sender: sender,
          text: text,
          time: timeString
        });
        conv.lastMessage = `${sender === 'customer' ? 'Customer' : 'Provider'}: ${text}`;
        conv.lastMessageTime = 'Just now';
        setStorage(STORAGE_KEYS.MESSAGES, conversations);

        // Async message post in backend
        const reqNum = parseInt(String(conv.requestId || '1').replace(/\D/g, ''), 10) || 1;
        apiFetch(`/requests/${reqNum}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content: text })
        }).catch(() => { });

        return conv;
      }
      return null;
    },

    // 6. Reviews
    getReviewsByProviderId: function (providerId) {
      const numId = parseInt(String(providerId).replace(/^prov-/, ''), 10);
      return [
        {
          id: 'REV-01',
          providerId: numId || 1,
          customerName: 'Verified Customer',
          location: 'Nigeria',
          rating: 5,
          date: 'Recent',
          serviceType: 'Standard Service Job',
          comment: 'Extremely polite, knowledgeable, and reliable service. Job was completed neatly without any delays.',
          verifiedJob: true
        }
      ];
    },

    submitReview: function (data) {
      const provId = parseInt(String(data.providerId || '1').replace(/^prov-/, ''), 10);
      apiFetch('/reviews/', {
        method: 'POST',
        body: JSON.stringify({
          provider_id: provId,
          rating: data.rating || 5.0,
          comment: data.comment || 'Great service.'
        })
      }).catch(() => { });

      return { success: true };
    }
  };

  // Expose API globally
  window.HandyAPI = HandyAPI;
})(window);
