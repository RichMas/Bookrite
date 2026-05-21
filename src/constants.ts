export const SERVICE_CATEGORIES = [
  { 
    name: 'Plumbers, Electricians & Mechanics', 
    icon: '🛠️', 
    services: [
      { name: 'Blocked Drain', price: 650 },
      { name: "Tap Won't Stop Pouring Water", price: 420 },
      { name: 'Blocked Toilet', price: 580 },
      { name: 'Burst Pipe Repair', price: 950 },
      { name: 'Geyser Installation', price: 3200 },
      { name: 'Geyser Replacement', price: 2400 },
      { name: 'Leaking Shower / Bath', price: 680 },
      { name: 'General Call-Out Fee (Plumbing)', price: 420 },
      { name: 'Power Trip / No Electricity', price: 550 },
      { name: 'Light Fitting Installation', price: 380 },
      { name: 'Plug Point Installation', price: 450 },
      { name: 'DB Board Replacement', price: 3800 },
      { name: 'Electrical Fault Finding', price: 750 },
      { name: 'Solar Panel Installation', price: 12000 },
      { name: 'Outdoor / Security Lighting', price: 900 },
      { name: 'COC Certificate', price: 1200 },
      { name: 'Car Service (Basic)', price: 1200 },
      { name: 'Brake Pad Replacement', price: 450 },
      { name: 'Battery Replacement', price: 300 },
      { name: 'Clutch Replacement', price: 2800 },
      { name: 'Engine Fault Finding', price: 750 },
    ]
  },
  { 
    name: 'Handyman', 
    icon: '🔨', 
    services: [
      { name: 'Half Day (4 hours)', price: 680 },
      { name: 'Full Day (8 hours)', price: 1200 },
      { name: 'Painting (per room)', price: 1100 },
      { name: 'Tiling (per m²)', price: 320 },
      { name: 'Cupboard & Shelf Fitting', price: 900 },
      { name: 'Door / Window Repair', price: 580 },
      { name: 'TV & Appliance Mounting', price: 480 },
      { name: 'Waterproofing (per m²)', price: 220 },
      { name: 'Furniture Repair', price: 550 },
      { name: 'Fridge Repair', price: 750 },
      { name: 'Appliance Repair (General)', price: 480 },
    ]
  },
  { 
    name: 'Bricklayers and Painters', 
    icon: '🧱', 
    services: [
      { name: 'External Wall Painting (per m²)', price: 65 },
      { name: 'Internal Wall Painting (per m²)', price: 45 },
      { name: 'Bricklaying (per 1000 bricks)', price: 2200 },
      { name: 'Plastering (per m²)', price: 85 },
      { name: 'Boundary Wall Construction (per meter)', price: 1200 },
    ]
  },
  { 
    name: 'Backroom Rentals', 
    icon: '🏠', 
    services: [
      { name: 'Single Room Monthly Rental', price: 1800 },
      { name: 'Room with En-suite Monthly', price: 2500 },
      { name: 'Bachelor Flat Monthly', price: 3200 },
      { name: 'Two Room Suite Monthly', price: 3800 },
    ]
  },
  { 
    name: 'Guesthouses & BnBs', 
    icon: '🏨', 
    services: [
      { name: 'Budget Room', price: 550 },
      { name: 'Standard Room', price: 950 },
      { name: 'Deluxe Room', price: 1500 },
      { name: 'Self-Catering Unit', price: 1200 },
      { name: 'Honeymoon / Luxury Suite', price: 2800 },
      { name: 'Breakfast Add-On', price: 160 },
    ]
  },
  { 
    name: 'Bakkie Hire', 
    icon: '🚚', 
    services: [
      { name: 'Local Delivery', price: 600 },
      { name: 'Furniture Removal', price: 900 },
      { name: 'Full Home Move (local)', price: 2200 },
      { name: 'Long Distance Trip', price: 11, unit: '/km' },
      { name: "Builder's Material Delivery", price: 750 },
      { name: 'Garden & Rubble Removal', price: 800 },
      { name: 'Single Appliance Delivery', price: 520 },
    ]
  },
  { 
    name: 'Catering', 
    icon: '🍱', 
    services: [
      { name: 'Wedding Catering', price: 580, unit: '/head' },
      { name: 'Birthday Party Catering', price: 250, unit: '/head' },
      { name: 'Corporate Event Catering', price: 380, unit: '/head' },
      { name: 'Anniversary Dinner', price: 520, unit: '/head' },
      { name: 'Finger Food & Platters', price: 220, unit: '/head' },
      { name: 'Kiddies Party Catering', price: 160, unit: '/head' },
      { name: 'Serving Staff', price: 780, unit: '/staff' },
    ]
  },
  { 
    name: 'Personal Trainer', 
    icon: '🏋️', 
    services: [
      { name: 'Single Session (1 hour)', price: 450 },
      { name: 'Weight Loss Programme', price: 4200 },
      { name: 'Muscle Building Programme', price: 4500 },
      { name: 'Home Workout Session', price: 520 },
      { name: 'Online Coaching (monthly)', price: 2000 },
      { name: 'Nutrition Plan', price: 950 },
      { name: 'Group Session (up to 5)', price: 900 },
    ]
  },
  { 
    name: 'Private Chef', 
    icon: '👨‍🍳', 
    services: [
      { name: 'Romantic Dinner for 2', price: 1100 },
      { name: 'Family Dinner (up to 6)', price: 1900 },
      { name: 'Weekly Meal Prep (5 days)', price: 3200 },
      { name: 'Birthday Dinner Experience', price: 2600 },
      { name: 'Braai / Outdoor Cooking', price: 1800 },
      { name: 'Dietary Specialist', price: 1500 },
      { name: 'Kids Party Catering', price: 1300 },
    ]
  },
  { 
    name: 'Builders', 
    icon: '🏗️', 
    services: [
      { name: 'Garage Construction', price: 0, custom: true },
      { name: 'Room Addition', price: 0, custom: true },
      { name: 'Build a New Wall', price: 0, custom: true },
      { name: 'New House Build', price: 0, custom: true },
      { name: 'Renovations', price: 0, custom: true },
    ]
  },
  { 
    name: 'Machine Hire', 
    icon: '🚜', 
    services: [
      { name: 'Concrete Mixer', price: 750 },
      { name: 'Generator', price: 1100 },
      { name: 'Plate Compactor / Tamper', price: 680 },
      { name: 'Mini Excavator', price: 4500 },
      { name: 'Scaffolding', price: 2000 },
      { name: 'Angle Grinder / Power Tools', price: 400 },
      { name: 'Water Pump', price: 550 },
    ]
  },
  { 
    name: 'Hair & Beauty', 
    icon: '💇', 
    services: [
      { name: 'Haircut & Style', price: 320 },
      { name: 'Box Braids', price: 850 },
      { name: 'Weave Installation', price: 1200 },
      { name: 'Blow-Out & Styling', price: 420 },
      { name: 'Full Nail Set (gel/acrylic)', price: 520 },
      { name: 'Facial Treatment', price: 650 },
      { name: 'Bridal / Event Makeup', price: 980 },
      { name: 'Eyebrow Threading / Wax', price: 180 },
    ]
  },
  { 
    name: 'Art & Tattoos', 
    icon: '🎨', 
    services: [
      { name: 'Small Tattoo', price: 750 },
      { name: 'Medium Tattoo', price: 1800 },
      { name: 'Large Tattoo', price: 3500 },
      { name: 'Full Sleeve Tattoo', price: 6000 },
      { name: 'Wall Mural (per m²)', price: 500 },
      { name: 'Custom Canvas Painting', price: 1800 },
      { name: 'Portrait Commission', price: 2200 },
    ]
  },
  { 
    name: 'Photographer', 
    icon: '📸', 
    services: [
      { name: 'Portrait Session (1 hour)', price: 1100 },
      { name: 'Birthday / Family Shoot', price: 1800 },
      { name: 'Corporate Headshots', price: 2200 },
      { name: 'Event Coverage (4 hours)', price: 3500 },
      { name: 'Wedding Photography', price: 12000 },
      { name: 'Product / E-commerce Shoot', price: 2500 },
      { name: 'Real Estate Photography', price: 2000 },
    ]
  },
  { 
    name: 'Tutors', 
    icon: '👨‍🎓', 
    services: [
      { name: 'Primary School', price: 200, unit: '/hr' },
      { name: 'High School (Maths/Science)', price: 380, unit: '/hr' },
      { name: 'High School (Languages)', price: 320, unit: '/hr' },
      { name: 'Matric Exam Prep', price: 420, unit: '/hr' },
      { name: 'University Level', price: 550, unit: '/hr' },
      { name: 'Online Tutoring', price: 280, unit: '/hr' },
    ]
  },
  {
    name: 'Cleaner',
    icon: '🧹',
    services: [
      { name: 'Standard House Clean', price: 450 },
      { name: 'Deep Clean (Full House)', price: 1200 },
      { name: 'Window Cleaning', price: 350 },
      { name: 'Carpet Cleaning (per room)', price: 280 },
      { name: 'Office Cleaning (per m²)', price: 15 },
    ]
  }
];
