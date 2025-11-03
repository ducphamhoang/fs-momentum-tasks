'use server';
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

if (admin.apps.length > 0) {
  adminApp = admin.apps[0] as admin.app.App;
} else {
  // During development, GOOGLE_APPLICATION_CREDENTIALS is set by App Hosting's emulator.
  // In production, the service account is automatically discovered.
  // We must check if the app is initialized, otherwise it will error.
  if (process.env.NODE_ENV === 'development') {
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||=
      './.firebase/service-account.json';
  }

  adminApp = admin.initializeApp();
}

export { adminApp };
