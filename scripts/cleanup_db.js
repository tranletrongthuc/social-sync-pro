import { getClientAndDb } from '../api/lib/mongodb.js';

async function cleanup() {
  try {
    const { db, client } = await getClientAndDb();

    console.log('Dropping collections...');
    try {
      await db.collection('brandSettings').drop();
      console.log('Dropped brandSettings');
    } catch (error) {
      if (error.codeName !== 'NamespaceNotFound') {
        throw error;
      }
      console.log('brandSettings collection not found, skipping.');
    }
    try {
      await db.collection('brandValues').drop();
      console.log('Dropped brandValues');
    } catch (error) {
      if (error.codeName !== 'NamespaceNotFound') {
        throw error;
      }
      console.log('brandValues collection not found, skipping.');
    }
    try {
      await db.collection('keyMessages').drop();
      console.log('Dropped keyMessages');
    } catch (error) {
      if (error.codeName !== 'NamespaceNotFound') {
        throw error;
      }
      console.log('keyMessages collection not found, skipping.');
    }
    try {
      await db.collection('logoConcepts').drop();
      console.log('Dropped logoConcepts');
    } catch (error) {
      if (error.codeName !== 'NamespaceNotFound') {
        throw error;
      }
      console.log('logoConcepts collection not found, skipping.');
    }

    console.log('Clearing brands collection...');
    await db.collection('brands').deleteMany({});
    console.log('Cleared brands collection');

    await client.close();
    console.log('Database cleanup successful.');
  } catch (error) {
    console.error('Error during database cleanup:', error);
    process.exit(1);
  }
}

cleanup();
