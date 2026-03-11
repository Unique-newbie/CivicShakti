/**
 * Appwrite Location Seed Script
 * Run with: node scripts/seed-appwrite.js
 */

const { Client, Databases, ID, Users } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const users = new Users(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'civic_db';

async function seed() {
    console.log('🌱 Seeding location hierarchy...\n');

    // --- States ---
    const stateMap = {};
    const stateData = ['Rajasthan', 'Gujarat', 'Uttar Pradesh'];
    for (const name of stateData) {
        try {
            const doc = await databases.createDocument(DB_ID, 'states', ID.unique(), { name });
            stateMap[name] = doc.$id;
            console.log(`✅ State: ${name}`);
        } catch (e) {
            if (e.code === 409) {
                console.log(`ℹ️  State "${name}" exists, fetching...`);
                const list = await databases.listDocuments(DB_ID, 'states', [`equal("name", "${name}")`]);
                if (list.documents.length) stateMap[name] = list.documents[0].$id;
            } else console.error(`❌ State "${name}":`, e.message);
        }
    }

    // --- Cities ---
    const cityMap = {};
    const cityData = [
        { name: 'Jaipur', state: 'Rajasthan' },
        { name: 'Jodhpur', state: 'Rajasthan' },
        { name: 'Ahmedabad', state: 'Gujarat' },
        { name: 'Lucknow', state: 'Uttar Pradesh' },
    ];
    for (const c of cityData) {
        try {
            const doc = await databases.createDocument(DB_ID, 'cities', ID.unique(), {
                name: c.name, state_id: stateMap[c.state]
            });
            cityMap[c.name] = doc.$id;
            console.log(`✅ City: ${c.name}`);
        } catch (e) {
            if (e.code === 409) console.log(`ℹ️  City "${c.name}" exists`);
            else console.error(`❌ City "${c.name}":`, e.message);
        }
    }

    // --- Villages ---
    const villageMap = {};
    const villageData = [
        { name: 'Mansarovar', city: 'Jaipur' },
        { name: 'Jagatpura', city: 'Jaipur' },
        { name: 'Tonk Road', city: 'Jaipur' },
        { name: 'Sardarpura', city: 'Jodhpur' },
        { name: 'Satellite', city: 'Ahmedabad' },
        { name: 'Hazratganj', city: 'Lucknow' },
    ];
    for (const v of villageData) {
        try {
            const doc = await databases.createDocument(DB_ID, 'villages', ID.unique(), {
                name: v.name, city_id: cityMap[v.city]
            });
            villageMap[v.name] = doc.$id;
            console.log(`✅ Village: ${v.name}`);
        } catch (e) {
            if (e.code === 409) console.log(`ℹ️  Village "${v.name}" exists`);
            else console.error(`❌ Village "${v.name}":`, e.message);
        }
    }

    // --- Wards ---
    const wardData = [
        { name: 'Ward 1 - Mansarovar', village: 'Mansarovar' },
        { name: 'Ward 2 - Mansarovar', village: 'Mansarovar' },
        { name: 'Ward 3 - Mansarovar', village: 'Mansarovar' },
        { name: 'Ward 1 - Jagatpura', village: 'Jagatpura' },
        { name: 'Ward 2 - Jagatpura', village: 'Jagatpura' },
        { name: 'Ward A - Sardarpura', village: 'Sardarpura' },
        { name: 'Ward B - Sardarpura', village: 'Sardarpura' },
        { name: 'Ward 1 - Satellite', village: 'Satellite' },
        { name: 'Ward 1 - Hazratganj', village: 'Hazratganj' },
    ];
    for (const w of wardData) {
        try {
            await databases.createDocument(DB_ID, 'wards', ID.unique(), {
                name: w.name, village_id: villageMap[w.village]
            });
            console.log(`✅ Ward: ${w.name}`);
        } catch (e) {
            if (e.code === 409) console.log(`ℹ️  Ward "${w.name}" exists`);
            else console.error(`❌ Ward "${w.name}":`, e.message);
        }
    }

    // --- Admin User ---
    console.log('\n🔑 Creating admin user...');
    try {
        const adminUser = await users.create(
            ID.unique(),
            'admin@civicshakti.com',
            undefined, // phone
            'admin123',
            'Super Admin'
        );

        // Create admin profile
        await databases.createDocument(DB_ID, 'profiles', ID.unique(), {
            user_id: adminUser.$id,
            full_name: 'Super Admin',
            admin_level: 'superadmin',
            trust_score: 100,
            is_verified: true,
        });

        // Add staff label
        await users.updateLabels(adminUser.$id, ['staff']);

        console.log('✅ Admin created: admin@civicshakti.com / admin123');
    } catch (e) {
        if (e.code === 409) console.log('ℹ️  Admin user already exists');
        else console.error('❌ Admin:', e.message);
    }

    console.log('\n✅ Seeding complete!');
}

seed().catch(console.error);
