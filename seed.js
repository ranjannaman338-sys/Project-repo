require('dotenv').config();
const mongoose = require('mongoose');
const Item = require('./models/Item');
const Bid = require('./models/Bid');

const items = [
  {
    title: "iPhone 15 Pro",
    description: "The latest iPhone with Apple A17 Pro chip and Titanium design. 256GB, Natural Titanium.",
    category: "Phones",
    startingPrice: 134900,
    currentBid: 134900,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_0.jpg"
  },
  {
    title: "Sony WH-1000XM5",
    description: "Industry-leading noise-canceling headphones with exceptional sound quality.",
    category: "Gadgets",
    startingPrice: 29990,
    currentBid: 30500,
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/sony_headphones.png"
  },
  {
    title: "Tesla Model 3",
    description: "2024 Tesla Model 3 Long Range. Clean title, Pearl White, 500 miles.",
    category: "Automobiles",
    startingPrice: 5500000,
    currentBid: 5650000,
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_1.jpg"
  },
  {
    title: "ASUS ROG Zephyrus G14",
    description: "AMD Ryzen 9, RTX 4070, 32GB RAM, 1TB SSD. Powerful gaming performance.",
    category: "Laptops",
    startingPrice: 174990,
    currentBid: 182000,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_2.jpg"
  },
  {
    title: "Sony Alpha A7 IV",
    description: "33MP Full-Frame Mirrorless Camera with 4K Video capability.",
    category: "Cameras",
    startingPrice: 218990,
    currentBid: 225000,
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/sony_camera.png"
  },
  {
    title: "Samsung Galaxy S24 Ultra",
    description: "Titanium Gray, 512GB. The ultimate AI-powered smartphone.",
    category: "Phones",
    startingPrice: 129999,
    currentBid: 135000,
    endTime: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_3.jpg"
  },
  {
    title: "Keychron Q1 Mechanical Keyboard",
    description: "Fully customizable mechanical keyboard with hot-swappable switches.",
    category: "Gadgets",
    startingPrice: 15999,
    currentBid: 16500,
    endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
    imageUrl: "/images/img_4.jpg"
  },
  {
    title: "BMW M3 (G80)",
    description: "2023 BMW M3 Competition. Isle of Man Green, carbon fiber package.",
    category: "Automobiles",
    startingPrice: 13100000,
    currentBid: 13500000,
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_5.jpg"
  },
  {
    title: "Rolex Submariner Date",
    description: "2024 Oyster Perpetual Submariner Date. 41mm, Cerachrom bezel, 300m waterproof.",
    category: "Watches",
    startingPrice: 1250000,
    currentBid: 1420000,
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_6.jpg"
  },
  {
    title: "Modern Glass Villa",
    description: "A stunning 4BHK architectural masterpiece in Alibaug. Private pool and ocean view.",
    category: "Real Estate",
    startingPrice: 150000000,
    currentBid: 155000000,
    endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_7.jpg"
  },
  {
    title: "Herman Miller Aeron Chair",
    description: "The gold standard in ergonomic office chairs. Size B, fully loaded, Graphite.",
    category: "Furniture",
    startingPrice: 95000,
    currentBid: 98000,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_8.jpg"
  },
  {
    title: "Omega Speedmaster Moonwatch",
    description: "The first watch worn on the moon. Professional Co-Axial Master Chronometer.",
    category: "Watches",
    startingPrice: 650000,
    currentBid: 685000,
    endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_9.jpg"
  },
  {
    title: "Eames Lounge Chair & Ottoman",
    description: "Iconic mid-century modern design. Santos Palisander frame with black leather.",
    category: "Furniture",
    startingPrice: 425000,
    currentBid: 440000,
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_10.jpg"
  },
  {
    title: "Rare Charizard Holographic",
    description: "1999 Base Set First Edition Shadowless Charizard. PSA 10 Gem Mint condition.",
    category: "Collectibles",
    startingPrice: 2500000,
    currentBid: 3200000,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_11.jpg"
  },
  {
    title: "Dyson Airwrap Multistyler",
    description: "Long barrel edition in Nickel/Copper. Complete set of attachments included.",
    category: "Gadgets",
    startingPrice: 42000,
    currentBid: 44500,
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_12.jpg"
  },
  {
    title: "LG 77\" OLED G4 TV",
    description: "The 2024 flagship OLED. 144Hz refresh rate, Brightness Booster Max.",
    category: "Home Electronics",
    startingPrice: 380000,
    currentBid: 405000,
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_13.jpg"
  },
  {
    title: "Luxury Penthouse, Mumbai",
    description: "45th Floor Triplex in Worli with sunset views and private elevator.",
    category: "Real Estate",
    startingPrice: 450000000,
    currentBid: 450000000,
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_14.jpg"
  },
  {
    title: "Vintage Vinyl Collection",
    description: "Set of 50 original Pink Floyd, Led Zeppelin, and Queen first pressings.",
    category: "Collectibles",
    startingPrice: 125000,
    currentBid: 132000,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_15.jpg"
  },
  {
    title: "Ducati Panigale V4 R",
    description: "The ultimate track-bred superbike. 240.5 hp in racing configuration.",
    category: "Automobiles",
    startingPrice: 6500000,
    currentBid: 6850000,
    endTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_16.jpg"
  },
  {
    title: "Caterpillar 320 Excavator",
    description: "2022 Hydraulic Excavator with only 1200 operating hours. Fully serviced.",
    category: "Industrial",
    startingPrice: 8500000,
    currentBid: 8500000,
    endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_17.jpg"
  },
  {
    title: "Hermès Birkin 30",
    description: "Gold Togo Leather with Palladium Hardware. Brand new, full set with receipt.",
    category: "Fashion",
    startingPrice: 1800000,
    currentBid: 1950000,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_18.jpg"
  },
  {
    title: "Modern Abstract Oil Painting",
    description: "Original 48x48 canvas by rising contemporary artist. Certificate of authenticity included.",
    category: "Fine Art",
    startingPrice: 350000,
    currentBid: 350000,
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_19.jpg"
  },
  {
    title: "Peloton Bike+",
    description: "The ultimate indoor cycling experience. 24\" tilting touchscreen, auto-resistance.",
    category: "Sports",
    startingPrice: 155000,
    currentBid: 155000,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    imageUrl: "/images/img_20.jpg"
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');
    
    await Item.deleteMany({});
    await Bid.deleteMany({});
    console.log('Cleared existing items and bids.');
    
    await Item.insertMany(items);
    console.log(`Successfully seeded ${items.length} items!`);
    
    process.exit();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
