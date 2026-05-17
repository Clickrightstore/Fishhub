import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable not set");
  process.exit(1);
}

async function seedBooks() {
  try {
    // Parse connection string
    const url = new URL(DATABASE_URL);
    const connection = await mysql.createConnection({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: parseInt(url.port || "3306"),
      ssl: { rejectUnauthorized: false },
    });

    console.log("🌊 Seeding fishing books...\n");
    console.log(`Connecting to: ${url.hostname}:${url.port}/${url.pathname.slice(1)}`);

    // Insert Deep Sea Fishing Book
    const deepSeaQuery = `
      INSERT INTO books (title, author, description, category, skillLevel, fishingType, price, coverImageUrl, isFlagship, averageRating, reviewCount, tableOfContents, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const deepSeaValues = [
      "Deep Sea Fishing: The Ultimate Guide",
      "Expert Anglers",
      "Master the art of deep sea fishing with this comprehensive guide. Learn proven techniques for trolling, jigging, bottom fishing, and chumming. Discover target species including Marlin, Tuna, Wahoo, and more. Get detailed gear recommendations, safety protocols, and strategies for landing trophy catches in offshore waters exceeding 100 feet depth. Perfect for intermediate to advanced anglers seeking to elevate their deep sea fishing skills.",
      "deep_sea",
      "advanced",
      "saltwater",
      29.99,
      "/manus-storage/Deep_Sea_Fishing_The_Ultimate_Guide_47374ce1.pdf",
      1,
      5.0,
      500,
      JSON.stringify([
        "Introduction to Deep Sea Fishing",
        "Target Species Guide",
        "Essential Gear for Deep Sea Fishing",
        "Deep Sea Fishing Techniques",
        "Trolling Methods",
        "Bottom Fishing",
        "Jigging Techniques",
        "Chumming Strategies",
        "Safety Equipment and Protocols",
        "Advanced Tactics and Tips",
      ]),
    ];

    await connection.execute(deepSeaQuery, deepSeaValues);
    console.log("✅ Deep Sea Fishing book inserted");

    // Insert Fly Fishing Book
    const flyFishingQuery = `
      INSERT INTO books (title, author, description, category, skillLevel, fishingType, price, coverImageUrl, isFlagship, averageRating, reviewCount, tableOfContents, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const flyFishingValues = [
      "The Complete Guide to Fly Fishing Environments & Fly Patterns",
      "Fly Fishing Masters",
      "A comprehensive resource for fly fishing across all environments. This 25-page guide covers rivers, streams, lakes, and saltwater flats with detailed fly patterns and seasonal strategies. Learn the art of fly selection, matching the hatch, and mastering casting techniques. Includes conservation ethics and practical tips for beginners and intermediate anglers. Perfect for anyone looking to explore the meditative and rewarding world of fly fishing.",
      "fly_fishing",
      "beginner",
      "freshwater",
      24.99,
      "/manus-storage/fly-fishing-book_2acdf6b8.pdf",
      0,
      4.8,
      320,
      JSON.stringify([
        "Introduction to Fly Fishing",
        "Understanding Fly Fishing Environments",
        "River & Stream Fly Patterns",
        "Stillwater Lake Fly Patterns",
        "Saltwater Flat Fly Patterns",
        "Fly Selection & Matching the Hatch",
        "Essential Gear by Environment",
        "Seasonal Fishing Guide",
        "Conservation & Ethics",
      ]),
    ];

    await connection.execute(flyFishingQuery, flyFishingValues);
    console.log("✅ Fly Fishing book inserted");

    console.log("\n🎉 Books successfully seeded!");
    console.log("\n✨ All books and reviews seeded successfully!");
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding books:", error);
    process.exit(1);
  }
}

seedBooks();
