import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable not set");
  process.exit(1);
}

async function updateBookCovers() {
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

    console.log("🎨 Updating book cover images...\n");

    // Update Deep Sea Fishing book cover
    await connection.execute(
      "UPDATE books SET coverImageUrl = ? WHERE title = ?",
      ["/manus-storage/ceHa3Ob2KMXa_39f3616a.jpg", "Deep Sea Fishing: The Ultimate Guide"]
    );
    console.log("✅ Deep Sea Fishing book cover updated");

    // Update Fly Fishing book cover
    await connection.execute(
      "UPDATE books SET coverImageUrl = ? WHERE title = ?",
      ["/manus-storage/UdRQAfzwBdNI_239f7a78.jpg", "The Complete Guide to Fly Fishing Environments & Fly Patterns"]
    );
    console.log("✅ Fly Fishing book cover updated");

    console.log("\n🎉 Book covers successfully updated!");
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating book covers:", error);
    process.exit(1);
  }
}

updateBookCovers();
