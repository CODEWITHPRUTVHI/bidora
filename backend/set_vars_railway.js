const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error('.env file not found');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Simple split for KEY=VALUE
    const parts = trimmed.split('=');
    if (parts.length < 2) continue;

    const key = parts[0];
    let value = parts.slice(1).join('=');

    // Strip quotes if any
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
    }

    if (key === 'DATABASE_URL') continue; // Skip DB URL usually managed by Railway or already correct

    try {
        console.log(`Setting ${key}...`);
        execSync(`railway variables set "${key}=${value}"`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Failed to set ${key}: ${e.message}`);
    }
}
