import { getDb } from './server/db.ts';
import { books } from './drizzle/schema.ts';

async function seedBooks() {
  const db = await getDb();
  
  if (!db) {
    console.error('Database connection failed');
    process.exit(1);
  }

  try {
    // Insert Deep Sea Fishing Book
    await db.insert(books).values({
      title: 'Deep Sea Fishing: The Ultimate Guide',
      author: 'Expert Anglers',
      description: 'Master the art of deep sea fishing with this comprehensive guide. Learn proven techniques for trolling, jigging, bottom fishing, and chumming. Discover target species including Marlin, Tuna, Wahoo, and more. Get detailed gear recommendations, safety protocols, and strategies for landing trophy catches in offshore waters exceeding 100 feet depth. Perfect for intermediate to advanced anglers seeking to elevate their deep sea fishing skills.',
      category: 'deep_sea',
      skillLevel: 'advanced',
      fishingType: 'saltwater',
      price: 295, // R295 ZAR
      coverImageUrl: '/manus-storage/Deep_Sea_Fishing_The_Ultimate_Guide_47374ce1.pdf',
      fileUrl: '/manus-storage/Deep_Sea_Fishing_The_Ultimate_Guide_47374ce1.pdf',
      isFlagship: true,
      averageRating: 5.0,
      reviewCount: 500,
      tableOfContents: JSON.stringify([
        'Introduction to Deep Sea Fishing',
        'Target Species Guide',
        'Essential Gear for Deep Sea Fishing',
        'Deep Sea Fishing Techniques',
        'Trolling Methods',
        'Bottom Fishing',
        'Jigging Techniques',
        'Chumming Strategies',
        'Safety Equipment and Protocols',
        'Advanced Tactics and Tips'
      ])
    });

    console.log('✓ Deep Sea Fishing book inserted');

    // Insert Fly Fishing Book
    await db.insert(books).values({
      title: 'The Complete Guide to Fly Fishing Environments & Fly Patterns',
      author: 'Fly Fishing Masters',
      description: 'A comprehensive resource for fly fishing across all environments. This 25-page guide covers rivers, streams, lakes, and saltwater flats with detailed fly patterns and seasonal strategies. Learn the art of fly selection, matching the hatch, and mastering casting techniques. Includes conservation ethics and practical tips for beginners and intermediate anglers. Perfect for anyone looking to explore the meditative and rewarding world of fly fishing.',
      category: 'fly_fishing',
      skillLevel: 'beginner',
      fishingType: 'freshwater',
      price: 250, // R250 ZAR
      coverImageUrl: '/manus-storage/fly-fishing-book_2acdf6b8.pdf',
      fileUrl: '/manus-storage/fly-fishing-book_2acdf6b8.pdf',
      isFlagship: false,
      averageRating: 4.8,
      reviewCount: 320,
      tableOfContents: JSON.stringify([
        'Introduction to Fly Fishing',
        'Understanding Fly Fishing Environments',
        'River & Stream Fly Patterns',
        'Stillwater Lake Fly Patterns',
        'Saltwater Flat Fly Patterns',
        'Fly Selection & Matching the Hatch',
        'Essential Gear by Environment',
        'Seasonal Fishing Guide',
        'Conservation & Ethics'
      ])
    });

    console.log('✓ Fly Fishing book inserted');
    console.log('✓ Books successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding books:', error);
    process.exit(1);
  }
}

seedBooks();
