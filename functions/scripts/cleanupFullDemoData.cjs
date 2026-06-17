const path = require("path");
const admin = require("firebase-admin");

const REQUIRE_FLAG = "--confirm-production";
const EXPECTED_PROJECT_ID = "myblogapp-4bae3";
const OWNER_UID = "47N2eyNIwPP7CsV6gcKgSwBUZ3D2";
const SEED_BATCH_ID = "production-demo-v1";

if (!process.argv.includes(REQUIRE_FLAG)) {
  console.error(`Refusing to run. Re-run with ${REQUIRE_FLAG}`);
  process.exit(1);
}

const serviceAccountPath = path.join(
  __dirname,
  "../.secrets/liferecompiled-prod.serviceAccount.json"
);

const serviceAccount = require(serviceAccountPath);

if (serviceAccount.project_id !== EXPECTED_PROJECT_ID) {
  console.error(
    `[cleanup] Refusing to run. Expected project ${EXPECTED_PROJECT_ID}, got ${serviceAccount.project_id}`
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

const savedPostIdsForOwner = [
  "demo_post_ui_details_matter",
  "demo_post_saved_posts",
  "demo_post_mobile_first",
  "demo_post_building_in_public",
];

const demoUserIds = [
  "demo_mina_frontend",
  "demo_luka_backend",
  "demo_sara_ux",
  "demo_nikola_devops",
  "demo_ana_product",
  "demo_marko_fullstack",
];

async function deleteQuerySnapshot(querySnapshot, label) {
  if (querySnapshot.empty) {
    console.log(`[cleanup] No ${label} found.`);
    return;
  }

  const CHUNK_SIZE = 400;
  const docs = querySnapshot.docs;

  for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
    const chunk = docs.slice(i, i + CHUNK_SIZE);
    const batch = db.batch();

    chunk.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
    console.log(`[cleanup] Deleted ${chunk.length} ${label}.`);
  }
}

async function cleanupCollectionBySeedBatch(collectionName) {
  const snap = await db
    .collection(collectionName)
    .where("seedBatchId", "==", SEED_BATCH_ID)
    .get();

  await deleteQuerySnapshot(snap, collectionName);
}

async function cleanupFullDemoData() {
  console.log(`[cleanup] Starting cleanup for ${SEED_BATCH_ID}`);
  console.log(`[cleanup] Project: ${serviceAccount.project_id}`);

  await cleanupCollectionBySeedBatch("reactions");
  await cleanupCollectionBySeedBatch("comments");

  for (const postId of savedPostIdsForOwner) {
    await db
      .collection("users")
      .doc(OWNER_UID)
      .collection("savedPosts")
      .doc(postId)
      .delete()
      .catch(() => null);

    console.log(`[cleanup] Deleted owner savedPosts ref for ${postId} if it existed.`);
  }

  await cleanupCollectionBySeedBatch("posts");
  await cleanupCollectionBySeedBatch("users");

  for (const uid of demoUserIds) {
    await db.collection("userStats").doc(uid).delete().catch(() => null);
    console.log(`[cleanup] Deleted userStats/${uid} if it existed.`);
  }

  console.log("[cleanup] Done.");
  console.log("[cleanup] Note: processedEvents/reactionLedger technical docs may remain until TTL cleanup.");
}

cleanupFullDemoData().catch((error) => {
  console.error("[cleanup] Failed:", error);
  process.exit(1);
});
