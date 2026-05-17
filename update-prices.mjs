import { getDb } from './server/db.ts';
import { books } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function updatePrices() {
  const db = await getDb();
  
  if (!db) {
    console.error('Database connection failed');
    process.exit(1);
  }

  try {
    // Update Deep Sea Fishing book price
    await db.update(books)
      .set({ price: 502 })
      .where(eq(books.title, 'Deep Sea Fishing: The Ultimate Guide'));
    
    console.log('✓ Updated Deep Sea Fishing price to R502');

    // Update Fly Fishing book price
    await db.update(books)
      .set({ price: 418 })
      .where(eq(books.title, 'The Complete Guide to Fly Fishing Environments & Fly Patterns'));
    
    console.log('✓ Updated Fly Fishing price to R418');
    console.log('✓ All prices successfully updated to ZAR!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating prices:', error);
    process.exit(1);
  }
}

updatePrices();
