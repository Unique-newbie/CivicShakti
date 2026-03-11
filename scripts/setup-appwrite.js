/**
 * Appwrite Database Setup Script
 * Run with: node scripts/setup-appwrite.js
 * 
 * Creates all required collections and attributes in your Appwrite project.
 */

const { Client, Databases, ID, Permission, Role } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'civic_db';

async function createDB() {
    try {
        await databases.create(DB_ID, 'Civic DB');
        console.log('✅ Database created');
    } catch (e) {
        if (e.code === 409) console.log('ℹ️  Database already exists');
        else if (e.code === 403) console.log('ℹ️  Database limit reached (free tier) — using existing DB');
        else { console.error('DB creation error:', e.code, e.message); }
    }
}

async function createCollection(id, name, attrs, indexes = []) {
    try {
        await databases.createCollection(DB_ID, id, name, [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
        ]);
        console.log(`✅ Collection "${name}" created`);
    } catch (e) {
        if (e.code === 409) console.log(`ℹ️  Collection "${name}" already exists`);
        else { console.error(`❌ Collection "${name}":`, e.message); return; }
    }

    for (const attr of attrs) {
        try {
            if (attr.type === 'string') {
                await databases.createStringAttribute(DB_ID, id, attr.key, attr.size || 255, attr.required || false, attr.default ?? undefined, attr.array || false);
            } else if (attr.type === 'integer') {
                await databases.createIntegerAttribute(DB_ID, id, attr.key, attr.required || false, attr.min ?? undefined, attr.max ?? undefined, attr.default ?? undefined, attr.array || false);
            } else if (attr.type === 'float') {
                await databases.createFloatAttribute(DB_ID, id, attr.key, attr.required || false, attr.min ?? undefined, attr.max ?? undefined, attr.default ?? undefined, attr.array || false);
            } else if (attr.type === 'boolean') {
                await databases.createBooleanAttribute(DB_ID, id, attr.key, attr.required || false, attr.default ?? undefined, attr.array || false);
            } else if (attr.type === 'datetime') {
                await databases.createDatetimeAttribute(DB_ID, id, attr.key, attr.required || false, attr.default ?? undefined, attr.array || false);
            } else if (attr.type === 'email') {
                await databases.createEmailAttribute(DB_ID, id, attr.key, attr.required || false, attr.default ?? undefined, attr.array || false);
            } else if (attr.type === 'enum') {
                await databases.createEnumAttribute(DB_ID, id, attr.key, attr.elements, attr.required || false, attr.default ?? undefined, attr.array || false);
            }
            console.log(`   ✓ Attribute "${attr.key}"`);
        } catch (e) {
            if (e.code === 409) console.log(`   ℹ️  Attribute "${attr.key}" already exists`);
            else console.error(`   ❌ Attribute "${attr.key}":`, e.message);
        }
    }

    // Wait for attributes to be available before creating indexes
    if (indexes.length > 0) {
        console.log('   ⏳ Waiting for attributes to be ready...');
        await new Promise(r => setTimeout(r, 3000));
        for (const idx of indexes) {
            try {
                await databases.createIndex(DB_ID, id, idx.key, idx.type, idx.attributes, idx.orders || []);
                console.log(`   ✓ Index "${idx.key}"`);
            } catch (e) {
                if (e.code === 409) console.log(`   ℹ️  Index "${idx.key}" already exists`);
                else console.error(`   ❌ Index "${idx.key}":`, e.message);
            }
        }
    }
}

async function main() {
    console.log('🚀 Setting up Appwrite database...\n');

    await createDB();

    // ---------- States ----------
    await createCollection('states', 'States', [
        { key: 'name', type: 'string', size: 255, required: true },
    ], [
        { key: 'idx_name', type: 'unique', attributes: ['name'] },
    ]);

    // ---------- Cities ----------
    await createCollection('cities', 'Cities', [
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'state_id', type: 'string', size: 255, required: true },
    ], [
        { key: 'idx_state', type: 'key', attributes: ['state_id'] },
    ]);

    // ---------- Villages ----------
    await createCollection('villages', 'Villages', [
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'city_id', type: 'string', size: 255, required: true },
    ], [
        { key: 'idx_city', type: 'key', attributes: ['city_id'] },
    ]);

    // ---------- Wards ----------
    await createCollection('wards', 'Wards', [
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'village_id', type: 'string', size: 255, required: true },
    ], [
        { key: 'idx_village', type: 'key', attributes: ['village_id'] },
    ]);

    // ---------- Profiles ----------
    await createCollection('profiles', 'Profiles', [
        { key: 'user_id', type: 'string', size: 255, required: true },
        { key: 'trust_score', type: 'integer', required: false, default: 50, min: 0, max: 100 },
        { key: 'full_name', type: 'string', size: 255, required: false },
        { key: 'phone_number', type: 'string', size: 50, required: false },
        { key: 'address', type: 'string', size: 1000, required: false },
        { key: 'gov_id_url', type: 'string', size: 2000, required: false },
        { key: 'is_verified', type: 'boolean', required: false, default: false },
        { key: 'admin_level', type: 'string', size: 50, required: false, default: 'none' },
        { key: 'state_id', type: 'string', size: 255, required: false },
        { key: 'city_id', type: 'string', size: 255, required: false },
        { key: 'village_id', type: 'string', size: 255, required: false },
        { key: 'ward_id', type: 'string', size: 255, required: false },
    ], [
        { key: 'idx_user', type: 'unique', attributes: ['user_id'] },
    ]);

    // ---------- Complaints ----------
    await createCollection('complaints', 'Complaints', [
        { key: 'tracking_id', type: 'string', size: 50, required: true },
        { key: 'citizen_contact', type: 'string', size: 255, required: false },
        { key: 'category', type: 'string', size: 100, required: true },
        { key: 'sub_category', type: 'string', size: 100, required: false },
        { key: 'description', type: 'string', size: 5000, required: true },
        { key: 'lat', type: 'float', required: false },
        { key: 'lng', type: 'float', required: false },
        { key: 'address', type: 'string', size: 1000, required: false },
        { key: 'image_url', type: 'string', size: 50000, required: false },
        { key: 'status', type: 'string', size: 50, required: false, default: 'pending' },
        { key: 'urgency_level', type: 'string', size: 50, required: false, default: 'Normal' },
        { key: 'department', type: 'string', size: 255, required: false },
        { key: 'assigned_to', type: 'string', size: 255, required: false },
        { key: 'ai_priority_score', type: 'integer', required: false },
        { key: 'ai_analysis', type: 'string', size: 5000, required: false },
        { key: 'ai_department', type: 'string', size: 255, required: false },
        { key: 'resolution_image_url', type: 'string', size: 50000, required: false },
        { key: 'upvotes', type: 'integer', required: false, default: 0 },
        { key: 'device_fingerprint', type: 'string', size: 255, required: false },
        { key: 'state_id', type: 'string', size: 255, required: false },
        { key: 'city_id', type: 'string', size: 255, required: false },
        { key: 'village_id', type: 'string', size: 255, required: false },
        { key: 'ward_id', type: 'string', size: 255, required: false },
        { key: 'citizen_feedback_rating', type: 'integer', required: false },
        { key: 'citizen_feedback_text', type: 'string', size: 2000, required: false },
    ], [
        { key: 'idx_tracking', type: 'unique', attributes: ['tracking_id'] },
        { key: 'idx_citizen', type: 'key', attributes: ['citizen_contact'] },
        { key: 'idx_status', type: 'key', attributes: ['status'] },
        { key: 'idx_state', type: 'key', attributes: ['state_id'] },
        { key: 'idx_city', type: 'key', attributes: ['city_id'] },
    ]);

    // ---------- Status Logs ----------
    await createCollection('status_logs', 'Status Logs', [
        { key: 'complaint_id', type: 'string', size: 255, required: true },
        { key: 'status_from', type: 'string', size: 50, required: true },
        { key: 'status_to', type: 'string', size: 50, required: true },
        { key: 'changed_by_staff_id', type: 'string', size: 255, required: false },
        { key: 'remarks', type: 'string', size: 5000, required: false },
    ], [
        { key: 'idx_complaint', type: 'key', attributes: ['complaint_id'] },
    ]);

    // ---------- Error Logs ----------
    await createCollection('error_logs', 'Error Logs', [
        { key: 'error_type', type: 'string', size: 100, required: false },
        { key: 'errorMessage', type: 'string', size: 5000, required: true },
        { key: 'stack', type: 'string', size: 10000, required: false },
        { key: 'context', type: 'string', size: 5000, required: false },
    ]);

    // ---------- AI Feedback (Training Data) ----------
    await createCollection('ai_feedback', 'AI Feedback', [
        { key: 'complaint_id', type: 'string', size: 255, required: true },
        { key: 'staff_id', type: 'string', size: 255, required: false },
        { key: 'ai_category', type: 'string', size: 100, required: false },
        { key: 'correct_category', type: 'string', size: 100, required: false },
        { key: 'ai_severity_score', type: 'integer', required: false },
        { key: 'correct_severity', type: 'string', size: 50, required: false },
        { key: 'is_correct', type: 'boolean', required: false, default: true },
        { key: 'feedback_note', type: 'string', size: 2000, required: false },
        { key: 'image_url', type: 'string', size: 5000, required: false },
    ], [
        { key: 'idx_complaint', type: 'key', attributes: ['complaint_id'] },
        { key: 'idx_correct', type: 'key', attributes: ['is_correct'] },
    ]);

    console.log('\n✅ Setup complete! Seed location data with: node scripts/seed-appwrite.js');
}

main().catch(console.error);
