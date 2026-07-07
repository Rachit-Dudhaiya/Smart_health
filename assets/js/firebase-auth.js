/**
 * Smart Health - Firebase Auth Initialization Utility
 * Dynamically loads configuration from .env file and initializes Firebase
 */

(function () {
    window.firebaseAuthPromise = new Promise(async (resolve) => {
        try {
            const bodyEl = document.body;
            const pathPrefix = bodyEl.getAttribute('data-path-prefix') || './';

            const response = await fetch(`${pathPrefix}.env`);
            if (!response.ok) {
                console.warn('Firebase config not found; continuing in local demo mode.');
                resolve(null);
                return;
            }
            const text = await response.text();

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

            const apiKey = env.FIREABSE_API_KEY || env.FIREBASE_API_KEY;
            const authDomain = env.FIREABASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN;
            const projectId = env.FIREABSE_PROJECT_ID || env.FIREBASE_PROJECT_ID;
            const storageBucket = env.FIREBASE_STORAGE_BUCKET;
            const appId = env.FIREBASE_APP_ID;
            const measurementId = env.FIREBASE_MEASUREMENT_ID;

            if (!apiKey || !authDomain || !projectId) {
                console.warn('Firebase keys missing; continuing in local demo mode.');
                resolve(null);
                return;
            }

            const firebaseConfig = {
                apiKey: apiKey,
                authDomain: authDomain,
                projectId: projectId,
                storageBucket: storageBucket,
                appId: appId,
                measurementId: measurementId
            };

            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            resolve(firebase.auth());
        } catch (err) {
            console.warn('Firebase auth initialization unavailable; continuing in local demo mode.', err);
            resolve(null);
        }
    });
})();
