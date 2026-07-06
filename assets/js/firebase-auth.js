/**
 * Smart Health - Firebase Auth Initialization Utility
 * Dynamically loads configuration from .env file and initializes Firebase
 */

(function () {
    window.firebaseAuthPromise = new Promise(async (resolve, reject) => {
        try {
            const bodyEl = document.body;
            const pathPrefix = bodyEl.getAttribute('data-path-prefix') || './';

            // Fetch .env file
            const response = await fetch(`${pathPrefix}.env`);
            if (!response.ok) {
                throw new Error(`Failed to load .env configuration: ${response.status} ${response.statusText}`);
            }
            const text = await response.text();
            
            // Parse environment variables
            const env = {};
            text.split(/\r?\n/).forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const idx = trimmed.indexOf('=');
                    if (idx !== -1) {
                        const key = trimmed.substring(0, idx).trim();
                        const val = trimmed.substring(idx + 1).trim();
                        env[key] = val;
                    }
                }
            });

            // Map configurations supporting potential variable typos in .env
            const apiKey = env.FIREABSE_API_KEY || env.FIREBASE_API_KEY;
            const authDomain = env.FIREABASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN;
            const projectId = env.FIREABSE_PROJECT_ID || env.FIREBASE_PROJECT_ID;
            const storageBucket = env.FIREBASE_STORAGE_BUCKET;
            const appId = env.FIREBASE_APP_ID;
            const measurementId = env.FIREBASE_MEASUREMENT_ID;

            if (!apiKey || !authDomain || !projectId) {
                throw new Error("Missing Firebase keys in .env. Ensure FIREABSE_API_KEY, FIREABASE_AUTH_DOMAIN, and FIREABSE_PROJECT_ID are defined.");
            }

            const firebaseConfig = {
                apiKey: apiKey,
                authDomain: authDomain,
                projectId: projectId,
                storageBucket: storageBucket,
                appId: appId,
                measurementId: measurementId
            };

            // Initialize Firebase App
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            const auth = firebase.auth();
            resolve(auth);
        } catch (err) {
            console.error("Firebase auth initialization failed:", err);
            reject(err);
        }
    });
})();
