const { execSync } = require('child_process');

const vars = {
    'NEXT_PUBLIC_API_URL': 'https://bidora-api-production.up.railway.app/api/v1',
    'NEXT_PUBLIC_WS_URL': 'https://bidora-api-production.up.railway.app',
    'NEXT_PUBLIC_APP_URL': 'https://frontend-altimkj43-codewithprutvhis-projects.vercel.app',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'pk_test_51T5RZ4FvfgymZQ93i85WGXavQACD1G8PXZkIG68s2lo6U1edCFT4cOwgmpZXsOZlQ96ACXrsYaJyd364udXosrdy00ClOss5kX'
};

for (const [key, value] of Object.entries(vars)) {
    try {
        console.log(`Setting ${key}...`);
        execSync(`echo "${value}" | vercel env add ${key} production`);
    } catch (e) {
        console.log(e.message);
    }
}
