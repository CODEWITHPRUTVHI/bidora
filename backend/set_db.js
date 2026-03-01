const { execSync } = require('child_process');
const dbUrl = 'postgresql://neondb_owner:npg_XNT6BIJwV0kY@ep-curly-surf-aisedigy-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

try {
    console.log('Setting DATABASE_URL...');
    // Use an array to avoid shell expansion issues
    execSync(`railway variables set "DATABASE_URL=${dbUrl}"`, { stdio: 'inherit' });
    console.log('Success!');
} catch (e) {
    console.error('Failed:', e.message);
}
