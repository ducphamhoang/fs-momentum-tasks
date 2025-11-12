import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Placeholder function for initialization
export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// Export scheduled sync functions
export { scheduledTaskSync, manualTaskSync } from "./scheduled-sync";

// Export reminder check functions
export { checkReminders, manualReminderCheck } from "./check-reminders";
