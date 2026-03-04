import './src/utils/loadEnv';
import * as admin from 'firebase-admin';

async function testFirebase() {
    try {
        console.log('Testing Firebase Admin initialization...');
        if (admin.apps.length === 0) {
            admin.initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID
            });
            console.log('✅ Firebase Admin initialized with Project ID:', process.env.FIREBASE_PROJECT_ID);
        }
        const auth = admin.auth();
        console.log('✅ Firebase Auth service obtained');
    } catch (error: any) {
        console.error('❌ Firebase Admin check failed:', error.message);
    }
}

testFirebase();
