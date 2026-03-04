import dotenv from 'dotenv';
import path from 'path';

const result = dotenv.config();

if (result.error) {
    console.error('❌ Failed to load .env file:', result.error.message);
} else {
    console.log('✅ Environment variables loaded from:', path.resolve('.env'));
}
