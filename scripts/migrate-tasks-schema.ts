/**
 * Migration Script: Add Google Tasks Integration Fields to Existing Tasks
 *
 * This script updates existing task documents in Firestore to include the new fields
 * required for Google Tasks integration:
 * - Updates source field from 'web'/'chatbot' to 'local'
 * - Initializes externalId, externalEtag, lastSyncedAt as null
 * - Initializes reminders as empty array
 *
 * Usage: npx tsx scripts/migrate-tasks-schema.ts
 */

import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || "studio-9429142716-fa395",
  });
}

const db = admin.firestore();

interface TaskMigrationStats {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

async function migrateTasksSchema(): Promise<void> {
  console.log("🚀 Starting task schema migration...\n");

  const stats: TaskMigrationStats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Get all users
    const usersSnapshot = await db.collection("users").get();
    console.log(`📊 Found ${usersSnapshot.size} users\n`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`\n👤 Processing user: ${userId}`);

      // Get all tasks for this user
      const tasksSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("tasks")
        .get();

      console.log(`  📝 Found ${tasksSnapshot.size} tasks`);
      stats.total += tasksSnapshot.size;

      // Process each task
      for (const taskDoc of tasksSnapshot.docs) {
        try {
          const taskData = taskDoc.data();
          const taskId = taskDoc.id;

          // Check if task needs migration
          const needsMigration =
            !taskData.externalId &&
            !taskData.externalEtag &&
            !taskData.lastSyncedAt &&
            !taskData.reminders;

          if (!needsMigration) {
            console.log(`    ⏭️  Skipping task ${taskId} (already migrated)`);
            stats.skipped++;
            continue;
          }

          // Prepare update data
          const updateData: Record<string, any> = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          // Update source field
          if (taskData.source === "web" || taskData.source === "chatbot") {
            updateData.source = "local";
          } else if (!taskData.source) {
            updateData.source = "local";
          }

          // Initialize new fields
          if (!taskData.externalId) {
            updateData.externalId = null;
          }
          if (!taskData.externalEtag) {
            updateData.externalEtag = null;
          }
          if (!taskData.lastSyncedAt) {
            updateData.lastSyncedAt = null;
          }
          if (!taskData.reminders) {
            updateData.reminders = [];
          }

          // Update the document
          await taskDoc.ref.update(updateData);

          console.log(`    ✅ Updated task ${taskId}`);
          stats.updated++;
        } catch (error) {
          console.error(`    ❌ Error updating task ${taskDoc.id}:`, error);
          stats.errors++;
        }
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Migration Summary:");
    console.log("=".repeat(60));
    console.log(`Total tasks processed: ${stats.total}`);
    console.log(`✅ Successfully updated: ${stats.updated}`);
    console.log(`⏭️  Skipped (already migrated): ${stats.skipped}`);
    console.log(`❌ Errors: ${stats.errors}`);
    console.log("=".repeat(60));

    if (stats.errors === 0) {
      console.log("\n🎉 Migration completed successfully!");
    } else {
      console.log("\n⚠️  Migration completed with errors. Please review the logs.");
    }
  } catch (error) {
    console.error("\n❌ Fatal error during migration:", error);
    process.exit(1);
  }
}

// Run migration
migrateTasksSchema()
  .then(() => {
    console.log("\n✅ Migration script finished.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error);
    process.exit(1);
  });
