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
            'citizen@civicshakti.com',
            undefined, // phone
            'Citizen123!', // password
            'Citizen User'
        );
        console.log('✅ Citizen user created successfully!');
        console.log('Email: citizen@civicshakti.com');
        console.log('Password: Citizen123!');
    } catch (error) {
        if (error.code === 409) {
            console.log('⚠️ User already exists. Try logging in with:');
            console.log('Email: citizen@civicshakti.com');
            console.log('Password: Citizen123! (or whatever you set previously)');
        } else {
            console.error('❌ Failed to create citizen user:', error);
        }
    }
}

createAdmin();
