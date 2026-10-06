/**
 * HandyNaija — Mock API & Data Layer
 * Version 1.0 (MVP Frontend Foundation)
 * Provides local mock data, LocalStorage persistence, and simulated async methods.
 */

(function (window) {
  'use strict';

  const STORAGE_KEYS = {
    PROVIDERS: 'handynaija_providers',
    SERVICES: 'handynaija_services',
    REQUESTS: 'handynaija_requests',
    MESSAGES: 'handynaija_messages',
    LOCATIONS: 'handynaija_locations'
  };

  // --- Initial Mock Service Categories ---
  const INITIAL_SERVICES = [
    {
      id: 'plumbing',
      name: 'Plumbing & Pipe Fitting',
      slug: 'plumbing',
      icon: 'images/icons/plumbing.svg',
      description: 'Leak repairs, borehole pumps, bathroom & kitchen installations',
      providerCount: 48
    },
    {
      id: 'electrical',
      name: 'Electrical & Solar',
      slug: 'electrical',
      icon: 'images/icons/electrical.svg',
      description: 'Inverter setups, wiring, generator repairs & appliance repairs',
      providerCount: 64
    },
    {
      id: 'cleaning',
      name: 'Cleaning & Fumigation',
      slug: 'cleaning',
      icon: 'images/icons/cleaning.svg',
      description: 'Deep residential cleaning, office cleaning & pest control',
      providerCount: 35
    },
    {
      id: 'mechanic',
      name: 'Auto Mechanic & Diagnostics',
      slug: 'mechanic',
      icon: 'images/icons/mechanic.svg',
      description: 'Engine diagnostics, brake repairs, AC fix & roadside assistance',
      providerCount: 29
    },
    {
      id: 'carpenter',
      name: 'Carpentry & Woodwork',
      slug: 'carpenter',
      icon: 'images/icons/carpenter.svg',
      description: 'Custom furniture, kitchen cabinets, roof repairs & door fittings',
      providerCount: 22
    },
    {
      id: 'tutor',
      name: 'Home Tutoring & Lessons',
      slug: 'tutor',
      icon: 'images/icons/tutor.svg',
      description: 'WAEC/JAMB prep, primary school home tutors, coding & music',
      providerCount: 41
    },
    {
      id: 'technician',
      name: 'AC & Refrigeration Tech',
      slug: 'technician',
      icon: 'images/icons/technician.svg',
      description: 'Air conditioner servicing, gas refilling, freezer repairs',
      providerCount: 37
    },
    {
      id: 'painter',
      name: 'Painting & POP Design',
      slug: 'painter',
      icon: 'images/icons/painter.svg',
      description: 'Interior & exterior painting, screeding, POP ceiling installation',
      providerCount: 19
    }
  ];

  // --- Initial Mock Nigerian Locations (36 States + FCT) ---
  const ALL_NIGERIAN_STATES = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
    'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT-Abuja'
  ];

  const INITIAL_LOCATIONS = [
    {
      state: 'Anambra',
      cities: [
        { name: 'Awka', areas: ['Ifite', 'Aroma Junction', 'Agu-Awka', 'Zik Avenue', 'UNIZIK Area'] },
        { name: 'Onitsha', areas: ['GRA', 'Main Market', 'Fegge', 'Woliwo', '3-3 Area'] },
        { name: 'Nnewi', areas: ['Otolo', 'Umudim', 'Nnewichi', 'Uruagu'] }
      ]
    },
    {
      state: 'Lagos',
      cities: [
        { name: 'Ikeja', areas: ['GRA', 'Allen Avenue', 'Opebi', 'Alausa', 'Computer Village'] },
        { name: 'Lekki', areas: ['Phase 1', 'Ikate', 'Chevron', 'Agungi', 'Osapa London'] },
        { name: 'Yaba', areas: ['Akoka', 'Sabo', 'Tejuosho', 'Alagomeji', 'Abule Ijesha'] },
        { name: 'Victoria Island', areas: ['Adeola Odeku', 'Ahmadu Bello', 'Kofo Abayomi'] }
      ]
    },
    {
      state: 'FCT-Abuja',
      cities: [
        { name: 'Abuja Municipal', areas: ['Maitama', 'Wuse 2', 'Garki', 'Asokoro', 'Jabi', 'Gwarinpa'] },
        { name: 'Kubwa', areas: ['Phase 4', 'Kubwa Village', 'Arab Road', 'Byazhin'] }
      ]
    },
    {
      state: 'Rivers',
      cities: [
        { name: 'Port Harcourt', areas: ['GRA Phase 2', 'Peter Odili Road', 'Rumuokwuta', 'Trans-Amadi', 'Ada George'] }
      ]
    },
    {
      state: 'Oyo',
      cities: [
        { name: 'Ibadan', areas: ['Bodija', 'Ring Road', 'Samonda', 'Dugbe', 'Oluyole'] }
      ]
    },
    {
      state: 'Enugu',
      cities: [
        { name: 'Enugu City', areas: ['Independence Layout', 'New Haven', 'GRA', 'Ogui Road', 'Trans-Ekulu'] }
      ]
    },
    ...ALL_NIGERIAN_STATES
      .filter(s => !['Anambra', 'Lagos', 'FCT-Abuja', 'Rivers', 'Oyo', 'Enugu'].includes(s))
      .map(s => ({
        state: s,
        cities: [
          { name: `${s} Central`, areas: ['Central Area', 'GRA', 'Township'] }
        ]
      }))
  ];

  // --- Initial Mock Service Providers ---
  const INITIAL_PROVIDERS = [
    {
      id: 'prov-001',
      name: 'John Plumbing Services',
      avatar: 'images/providers/provider-1.svg',
      category: 'plumbing',
      categoryName: 'Plumbing & Pipe Fitting',
      isVerified: true,
      rating: 4.8,
      reviewCount: 34,
      experienceYears: 8,
      state: 'Anambra',
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
      id: 'prov-002',
      name: 'Chidi Solar & Electricals',
      avatar: 'images/providers/provider-2.svg',
      category: 'electrical',
      categoryName: 'Electrical & Solar',
      isVerified: true,
      rating: 4.9,
      reviewCount: 52,
      experienceYears: 10,
      state: 'Lagos',
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
      id: 'prov-003',
      name: 'Fatima Spotless Cleaning Pros',
      avatar: 'images/providers/provider-3.svg',
      category: 'cleaning',
      categoryName: 'Cleaning & Fumigation',
      isVerified: true,
      rating: 4.7,
      reviewCount: 29,
      experienceYears: 5,
      state: 'Abuja (FCT)',
      city: 'Abuja Municipal',
      area: 'Wuse 2 / Maitama',
      phone: '+234 814 555 8899',
      bio: 'Professional deep home cleaning, post-construction cleanup, upholstery steam cleaning, and residential fumigation.',
      services: ['Deep House Cleaning', 'Post-Construction', 'Fumigation', 'Sofa/Rug Cleaning', 'Office Sanitization'],
      startingRate: '₦12,000',
      availability: 'Mon - Sat: 8:00 AM - 5:00 PM',
      completedJobs: 65
    },
    {
      id: 'prov-004',
      name: 'Musa Auto Tech Diagnostics',
      avatar: 'images/providers/provider-4.svg',
      category: 'mechanic',
      categoryName: 'Auto Mechanic & Diagnostics',
      isVerified: true,
      rating: 4.6,
      reviewCount: 21,
      experienceYears: 12,
      state: 'Lagos',
      city: 'Yaba',
      area: 'Sabo / Akoka',
      phone: '+234 809 333 2211',
      bio: 'Modern computerized auto scanning, Japanese and German vehicle repairs, transmission servicing, and mobile breakdown rescue.',
      services: ['Computer Diagnostics', 'Brake Systems', 'Engine Overhaul', 'AC Servicing', 'Pre-purchase Inspection'],
      startingRate: '₦6,000',
      availability: 'Mon - Sat: 8:00 AM - 6:30 PM',
      completedJobs: 92
    },
    {
      id: 'prov-005',
      name: 'Emeka Craft Woodwork',
      avatar: 'images/providers/provider-1.svg',
      category: 'carpenter',
      categoryName: 'Carpentry & Woodwork',
      isVerified: true,
      rating: 4.8,
      reviewCount: 18,
      experienceYears: 7,
      state: 'Anambra',
      city: 'Onitsha',
      area: 'GRA / 3-3 Area',
      phone: '+234 816 777 4433',
      bio: 'Custom wardrobe builders, modern kitchen cabinets, hardwood door fittings, and roofing truss experts.',
      services: ['Kitchen Cabinets', 'Wardrobes', 'Door Hanging', 'Roof Repairs', 'Furniture Restyling'],
      startingRate: '₦7,000',
      availability: 'Mon - Sat: 8:00 AM - 6:00 PM',
      completedJobs: 47
    },
    {
      id: 'prov-006',
      name: 'Bright Minds Home Tutors',
      avatar: 'images/providers/provider-2.svg',
      category: 'tutor',
      categoryName: 'Home Tutoring & Lessons',
      isVerified: true,
      rating: 5.0,
      reviewCount: 40,
      experienceYears: 6,
      state: 'Rivers',
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
      id: 'prov-007',
      name: 'Kool Breeze AC & Cooling',
      avatar: 'images/providers/provider-3.svg',
      category: 'technician',
      categoryName: 'AC & Refrigeration Tech',
      isVerified: true,
      rating: 4.8,
      reviewCount: 38,
      experienceYears: 9,
      state: 'Lagos',
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
      id: 'prov-008',
      name: 'Segun Deluxe Painting & POP',
      avatar: 'images/providers/provider-4.svg',
      category: 'painter',
      categoryName: 'Painting & POP Design',
      isVerified: false,
      rating: 4.5,
      reviewCount: 14,
      experienceYears: 4,
      state: 'Oyo',
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

  // --- Initial Mock Service Requests ---
  const INITIAL_REQUESTS = [
    {
      id: 'REQ-00124',
      serviceName: 'Plumbing Repair',
      category: 'plumbing',
      providerId: 'prov-001',
      providerName: 'John Plumbing Services',
      customerId: 'cust-101',
      customerName: 'Chris Okonkwo',
      customerPhone: '+234 803 *** 1234',
      location: 'Ifite Road, Awka, Anambra',
      state: 'Anambra',
      city: 'Awka',
      area: 'Ifite',
      description: 'Kitchen sink is leaking underneath the cabinet. Water pools on the floor whenever the tap is opened.',
      preferredDate: 'Saturday, 10:00 AM',
      status: 'accepted', // pending, accepted, scheduled, inprogress, completed, rejected, cancelled
      createdAt: '2026-10-02 09:30',
      timeline: [
        { label: 'Submitted', done: true, time: 'Oct 2, 09:30 AM' },
        { label: 'Accepted', done: true, time: 'Oct 2, 09:45 AM' },
        { label: 'Scheduled', done: false, time: 'Pending' },
        { label: 'In Progress', done: false, time: 'Pending' },
        { label: 'Completed', done: false, time: 'Pending' }
      ]
    },
    {
      id: 'REQ-00125',
      serviceName: 'Solar Inverter Inspection',
      category: 'electrical',
      providerId: 'prov-002',
      providerName: 'Chidi Solar & Electricals',
      customerId: 'cust-101',
      customerName: 'Chris Okonkwo',
      customerPhone: '+234 803 *** 1234',
      location: 'Allen Avenue, Ikeja, Lagos',
      state: 'Lagos',
      city: 'Ikeja',
      area: 'Allen Avenue',
      description: 'The inverter shuts down abruptly after 30 minutes of load. Needs battery test and wiring check.',
      preferredDate: 'Monday, 02:00 PM',
      status: 'pending',
      createdAt: '2026-10-02 14:10',
      timeline: [
        { label: 'Submitted', done: true, time: 'Oct 2, 02:10 PM' },
        { label: 'Accepted', done: false, time: 'Pending' },
        { label: 'Scheduled', done: false, time: 'Pending' },
        { label: 'In Progress', done: false, time: 'Pending' },
        { label: 'Completed', done: false, time: 'Pending' }
      ]
    }
  ];

  // --- Initial Mock Messages ---
  const INITIAL_MESSAGES = [
    {
      id: 'conv-1',
      providerId: 'prov-001',
      providerName: 'John Plumbing Services',
      customerId: 'cust-101',
      customerName: 'Chris Okonkwo',
      requestId: 'REQ-00124',
      lastMessage: 'Customer: That works for me. Thank you.',
      lastMessageTime: '2m ago',
      messages: [
        { sender: 'customer', text: 'Good morning John. I submitted a request for the kitchen sink leak.', time: '09:32 AM' },
        { sender: 'provider', text: 'Good morning Chris! I have reviewed your request. I can arrive at 10:00 AM on Saturday.', time: '09:45 AM' },
        { sender: 'customer', text: 'That works for me. Thank you.', time: '09:48 AM' }
      ]
    },
    {
      id: 'conv-2',
      providerId: 'prov-002',
      providerName: 'Chidi Solar & Electricals',
      customerId: 'cust-101',
      customerName: 'Chris Okonkwo',
      requestId: 'REQ-00125',
      lastMessage: 'Chidi: Hello! What battery brand do you use?',
      lastMessageTime: '1h ago',
      messages: [
        { sender: 'customer', text: 'Hello Engineer Chidi, my 3.5kVA inverter is tripping off.', time: '01:15 PM' },
        { sender: 'provider', text: 'Hello! What battery brand and Ah capacity do you currently use?', time: '01:30 PM' }
      ]
    }
  ];

  // --- Initial Mock Reviews ---
  const INITIAL_REVIEWS = [
    {
      id: 'rev-001',
      providerId: 'prov-001',
      customerName: 'Emeka N.',
      location: 'Awka, Anambra',
      rating: 5,
      date: 'Sep 28, 2026',
      serviceType: 'Kitchen Pipe Leak Repair',
      comment: 'John was very punctual and professional. He quickly diagnosed the leak under our sink and replaced the damaged pipe with high quality PVC fittings. Highly recommended!',
      verifiedJob: true
    },
    {
      id: 'rev-002',
      providerId: 'prov-001',
      customerName: 'Amara O.',
      location: 'Ifite, Awka',
      rating: 4.8,
      date: 'Sep 15, 2026',
      serviceType: 'Borehole Overhead Tank Connection',
      comment: 'Arrived right on time and fixed our low pressure water issues. Neat work and fair pricing.',
      verifiedJob: true
    },
    {
      id: 'rev-003',
      providerId: 'prov-002',
      customerName: 'Tunde A.',
      location: 'Ikeja, Lagos',
      rating: 5,
      date: 'Sep 30, 2026',
      serviceType: '3.5kVA Solar Inverter Installation',
      comment: 'Engineer Chidi is a true master of solar tech. He re-calibrated my lithium battery settings and our inverter now lasts throughout the night effortlessly.',
      verifiedJob: true
    },
    {
      id: 'rev-004',
      providerId: 'prov-003',
      customerName: 'Zainab M.',
      location: 'Wuse 2, Abuja',
      rating: 4.9,
      date: 'Sep 22, 2026',
      serviceType: 'Post-Renovation Deep Cleaning',
      comment: 'Fatima and her team left the duplex sparkling clean! Every single tile, window sill, and bathroom was thoroughly sanitised.',
      verifiedJob: true
    },
    {
      id: 'rev-005',
      providerId: 'prov-004',
      customerName: 'Kelechi E.',
      location: 'Yaba, Lagos',
      rating: 4.7,
      date: 'Sep 18, 2026',
      serviceType: 'Computerized OBD-II Diagnostics',
      comment: 'He brought his scanner to my office in Yaba and cleared the check engine light within 30 minutes. Very honest mechanic.',
      verifiedJob: true
    }
  ];

  // --- Helpers for LocalStorage ---
  function getStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn('LocalStorage access error, falling back to default memory data', e);
      return fallback;
    }
  }

  function setStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage write error', e);
    }
  }

  // --- Initialize Storage if Empty ---
  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) setStorage(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  if (!localStorage.getItem(STORAGE_KEYS.LOCATIONS)) setStorage(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
  if (!localStorage.getItem(STORAGE_KEYS.PROVIDERS)) setStorage(STORAGE_KEYS.PROVIDERS, INITIAL_PROVIDERS);
  if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) setStorage(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
  if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) setStorage(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
  if (!localStorage.getItem('handynaija_reviews')) setStorage('handynaija_reviews', INITIAL_REVIEWS);

  // --- Mock API Public Interface ---
  const HandyAPI = {
    // Services
    getServices: function () {
      return getStorage(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    },

    // Reviews
    getReviewsByProviderId: function (providerId) {
      const reviews = getStorage('handynaija_reviews', INITIAL_REVIEWS);
      const filtered = reviews.filter(r => r.providerId === providerId);
      if (filtered.length > 0) return filtered;
      // Provide dynamic realistic reviews if none specifically defined
      return [
        {
          id: 'rev-auto-1',
          providerId: providerId,
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

    // Locations (States, Cities, Areas)
    getLocations: function () {
      return getStorage(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
    },

    // Providers
    getProviders: function (filters = {}) {
      const providers = getStorage(STORAGE_KEYS.PROVIDERS, INITIAL_PROVIDERS);
      return providers.filter(p => {
        if (filters.category && filters.category !== 'all' && p.category.toLowerCase() !== filters.category.toLowerCase()) {
          return false;
        }
        if (filters.state && filters.state !== 'all' && p.state.toLowerCase() !== filters.state.toLowerCase()) {
          return false;
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
          const matchBio = p.bio.toLowerCase().includes(q);
          const matchServices = p.services.some(s => s.toLowerCase().includes(q));
          if (!matchName && !matchBio && !matchServices) return false;
        }
        return true;
      });
    },

    getProviderById: function (id) {
      const providers = getStorage(STORAGE_KEYS.PROVIDERS, INITIAL_PROVIDERS);
      return providers.find(p => p.id === id) || null;
    },

    // Requests
    getRequests: function () {
      return getStorage(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
    },

    createRequest: function (data) {
      const requests = getStorage(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
      const newId = 'REQ-00' + (124 + requests.length);
      const newRequest = {
        id: newId,
        serviceName: data.serviceName || 'Custom Service',
        category: data.category || 'general',
        providerId: data.providerId || 'prov-001',
        providerName: data.providerName || 'Local Provider',
        customerId: data.customerId || 'cust-101',
        customerName: data.customerName || 'Customer',
        customerPhone: data.customerPhone || '+234 800 000 0000',
        location: `${data.area || ''}, ${data.city || ''}, ${data.state || ''}`.replace(/^,\s*|,\s*$/g, ''),
        state: data.state || 'Lagos',
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
      return newRequest;
    },

    updateRequestStatus: function (requestId, newStatus) {
      const requests = getStorage(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
      const index = requests.findIndex(r => r.id === requestId);
      if (index !== -1) {
        requests[index].status = newStatus;
        // Update timeline flags
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
        return requests[index];
      }
      return null;
    },

    // Messages
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
        return conv;
      }
      return null;
    }
  };

  // Expose API on window
  window.HandyAPI = HandyAPI;
})(window);
