import { Client, Users, ID } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
    console.error("❌ ERROR: APPWRITE_API_KEY is missing from .env.local");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(API_KEY);

const users = new Users(client);

async function createAdmin() {
    try {
        const user = await users.create(
            ID.unique(),
            'admin@civicshakti.com',
            undefined, // phone
            'Admin123!', // password
            'System Admin'
        );
        console.log('✅ Admin user created successfully!');
        console.log('Email: admin@civicshakti.com');
        console.log('Password: Admin123!');
    } catch (error) {
        if (error.code === 409) {
            console.log('⚠️ User already exists. Try logging in with:');
            console.log('Email: admin@civicshakti.com');
            console.log('Password: Admin123! (or whatever you set previously)');
        } else {
            console.error('❌ Failed to create admin user:', error);
        }
    }
}

createAdmin();
