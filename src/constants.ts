export const SERVICE_CATEGORIES = [
  { 
    name: 'Handyman', 
    icon: '🔨', 
    services: [
      { name: 'Half Day (4 Hours)', price: 350 },
      { name: 'Full Day (8 Hours)', price: 650 },
      { name: 'Painting (Per Room)', price: 500 },
      { name: 'Tiling (Per m²)', price: 150 },
      { name: 'Cupboard & Shelf Fitting', price: 400 },
      { name: 'Door / Window Repair', price: 250 },
      { name: 'TV & Appliance Mounting', price: 200 },
      { name: 'Waterproofing (Per m²)', price: 120 }
    ]
  },
  { 
    name: 'Bakkie Hire', 
    icon: '🚚', 
    services: [
      { name: 'Local Delivery (Within City)', price: 400 },
      { name: 'Furniture Removal', price: 600 },
      { name: 'Full Home Move (Local)', price: 1200 },
      { name: 'Long Distance', price: 8, unit: '/km' },
      { name: "Builder's Material Delivery", price: 450 },
      { name: 'Garden & Rubble Removal', price: 500 },
      { name: 'Single Appliance Delivery', price: 350 }
    ]
  },
  { 
    name: 'Electrician', 
    icon: '⚡', 
    services: [
      { name: 'Power Trip / No Electricity', price: 300 },
      { name: 'Light Fitting Installation', price: 200 },
      { name: 'Plug Point Installation', price: 250 },
      { name: 'DB Board Replacement', price: 2500 },
      { name: 'Electrical Fault Finding', price: 400 },
      { name: 'Solar Panel Installation', price: 8000 },
      { name: 'Outdoor / Security Lighting', price: 500 },
      { name: 'COC Certificate', price: 800 }
    ]
  },
  { 
    name: 'Plumber', 
    icon: '🚰', 
    services: [
      { name: 'Blocked Drain', price: 350 },
      { name: 'Tap Repair', price: 250 },
      { name: 'Blocked Toilet', price: 300 },
      { name: 'Burst Pipe Repair', price: 600 },
      { name: 'Geyser Installation', price: 2500 },
      { name: 'Geyser Replacement', price: 1800 },
      { name: 'Leaking Shower / Bath', price: 300 },
      { name: 'General Call-Out Fee', price: 200 }
    ]
  },
  { 
    name: 'Catering', 
    icon: '🍱', 
    services: [
      { name: 'Wedding Catering', price: 350, unit: '/head' },
      { name: 'Birthday Party Catering', price: 150, unit: '/head' },
      { name: 'Corporate Event Catering', price: 200, unit: '/head' },
      { name: 'Anniversary Dinner', price: 280, unit: '/head' },
      { name: 'Finger Food & Platters', price: 120, unit: '/head' },
      { name: 'Kiddies Party Catering', price: 100, unit: '/head' },
      { name: 'Serving Staff', price: 500, unit: '/staff member' }
    ]
  },
  { 
    name: 'Personal Trainer', 
    icon: '🏋️', 
    services: [
      { name: 'Single Session', price: 200 },
      { name: 'Weekly Plan (5 Sessions)', price: 800 },
      { name: 'Monthly Plan (20 Sessions)', price: 2500 },
      { name: 'Weight Loss Package', price: 2800 },
      { name: 'Muscle Building Package', price: 3000 },
      { name: 'Online Coaching', price: 1000 },
      { name: 'Group Session (Up To 5)', price: 500 }
    ]
  },
  { 
    name: 'Private Chef', 
    icon: '👨‍🍳', 
    services: [
      { name: 'Dinner For 2', price: 650 },
      { name: 'Family Dinner (Up To 6)', price: 1200 },
      { name: 'Weekly Meal Prep', price: 2000 },
      { name: 'Birthday Dinner Experience', price: 1500 },
      { name: 'Braai / Outdoor Cooking', price: 1000 },
      { name: 'Dietary Specialist Menu', price: 800 },
      { name: 'Kids Party Catering', price: 700 }
    ]
  },
  { 
    name: 'Builders', 
    icon: '🏗️', 
    services: [
      { name: 'Garage Construction', price: 0, custom: true },
      { name: 'Room Addition', price: 0, custom: true },
      { name: 'Build New Wall', price: 0, custom: true },
      { name: 'New House Build', price: 0, custom: true },
      { name: 'Renovations', price: 0, custom: true },
      { name: 'Plastering & Painting', price: 0, custom: true }
    ]
  },
  { 
    name: 'Machine Hire', 
    icon: '🚜', 
    services: [
      { name: 'Concrete Mixer (Per Day)', price: 450 },
      { name: 'Generator (Per Day)', price: 700 },
      { name: 'Plate Compactor / Tamper (Per Day)', price: 400 },
      { name: 'Mini Excavator (Per Day)', price: 3000 },
      { name: 'Scaffolding (Per Week)', price: 1200 },
      { name: 'Angle Grinder / Power Tools (Per Day)', price: 200 },
      { name: 'Water Pump (Per Day)', price: 300 }
    ]
  },
  { 
    name: 'Guesthouses & BNBs', 
    icon: '🏨', 
    services: [
      { name: 'Budget Room', price: 250, unit: '/night' },
      { name: 'Standard Room', price: 400, unit: '/night' },
      { name: 'Deluxe Room', price: 600, unit: '/night' },
      { name: 'Self-Catering Unit', price: 500, unit: '/night' },
      { name: 'Family Room', price: 650, unit: '/night' },
      { name: 'Honeymoon / Luxury Suite', price: 900, unit: '/night' },
      { name: 'Breakfast Add-On', price: 80 }
    ]
  },
  { 
    name: 'Hair & Beauty', 
    icon: '💇', 
    services: [
      { name: 'Haircut & Style', price: 150 },
      { name: 'Box Braids', price: 500 },
      { name: 'Weave Installation', price: 800 },
      { name: 'Blow-Out & Styling', price: 200 },
      { name: 'Full Nail Set', price: 300 },
      { name: 'Facial Treatment', price: 350 },
      { name: 'Bridal / Event Makeup', price: 600 },
      { name: 'Eyebrow Threading / Wax', price: 80 }
    ]
  },
  { 
    name: 'Art & Tattoos', 
    icon: '🎨', 
    services: [
      { name: 'Small Tattoo', price: 500 },
      { name: 'Medium Tattoo', price: 1200 },
      { name: 'Large Tattoo', price: 2500 },
      { name: 'Full Sleeve Tattoo', price: 4000 },
      { name: 'Wall Mural (Per m²)', price: 300 },
      { name: 'Custom Canvas Painting', price: 900 },
      { name: 'Portrait Commission', price: 1200 }
    ]
  },
  { 
    name: 'Photographer', 
    icon: '📸', 
    services: [
      { name: 'Portrait Session', price: 600 },
      { name: 'Birthday / Family Shoot', price: 1000 },
      { name: 'Corporate Headshots', price: 1200 },
      { name: 'Event Coverage (4 Hours)', price: 2000 },
      { name: 'Wedding Photography', price: 7000 },
      { name: 'Product / E-Commerce Shoot', price: 1500 },
      { name: 'Real Estate Photography', price: 1200 }
    ]
  },
  { 
    name: 'Tutors', 
    icon: '👨‍🎓', 
    services: [
      { name: 'Primary School Tutor', price: 100, unit: '/hr' },
      { name: 'High School Maths & Science', price: 180, unit: '/hr' },
      { name: 'High School Languages', price: 150, unit: '/hr' },
      { name: 'Matric Exam Preparation', price: 200, unit: '/hr' },
      { name: 'University Level Tutoring', price: 300, unit: '/hr' },
      { name: 'Online Tutoring', price: 120, unit: '/hr' }
    ]
  },
  { 
    name: 'Backroom Rentals', 
    icon: '🏠', 
    services: [
      { name: 'Basic Room (Outdoor Bathroom)', price: 1000, unit: '/month' },
      { name: 'Basic Room (Indoor Bathroom)', price: 1500, unit: '/month' },
      { name: 'Room With Indoor Bathroom', price: 2000, unit: '/month' },
      { name: 'Room With Kitchenette', price: 2500, unit: '/month' },
      { name: 'Room With Private Bathroom & Kitchenette', price: 3000, unit: '/month' },
      { name: 'Bachelor Flat', price: 3500, unit: '/month' }
    ]
  }
];
