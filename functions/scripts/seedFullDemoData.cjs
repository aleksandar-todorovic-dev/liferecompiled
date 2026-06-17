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
    `[seed] Refusing to run. Expected project ${EXPECTED_PROJECT_ID}, got ${serviceAccount.project_id}`
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();
const Timestamp = admin.firestore.Timestamp;

const now = new Date();

function minutesAgo(minutes) {
  return Timestamp.fromDate(new Date(now.getTime() - minutes * 60 * 1000));
}

function baseSeedFields() {
  return {
    isDemo: true,
    seedBatchId: SEED_BATCH_ID,
    createdBySeed: true,
  };
}

function makeTitleLc(title) {
  return String(title).trim().toLowerCase();
}

function tag(text) {
  return { id: text, text };
}

const demoUsers = [
  {
    id: "demo_mina_frontend",
    name: "Mina Frontend",
    email: "demo+mina@liferecompiled.com",
    bio:
      "Frontend-focused demo profile. Interested in clean layouts, readable components, accessibility, and small product details that make an app feel finished.",
  },
  {
    id: "demo_luka_backend",
    name: "Luka Backend",
    email: "demo+luka@liferecompiled.com",
    bio:
      "Backend-focused demo profile. Writes about data integrity, Cloud Functions, rules, and the boring parts that make a product reliable.",
  },
  {
    id: "demo_sara_ux",
    name: "Sara UX",
    email: "demo+sara@liferecompiled.com",
    bio:
      "UX demo profile. Focused on clarity, empty states, mobile flow, and helping users understand what is happening inside the product.",
  },
  {
    id: "demo_nikola_devops",
    name: "Nikola DevOps",
    email: "demo+nikola@liferecompiled.com",
    bio:
      "DevOps-minded demo profile. Interested in staging, deploy safety, logs, backups, and keeping releases boring in the best possible way.",
  },
  {
    id: "demo_ana_product",
    name: "Ana Product",
    email: "demo+ana@liferecompiled.com",
    bio:
      "Product demo profile. Looks at how features connect, what users actually need, and how small MVP decisions affect the whole experience.",
  },
  {
    id: "demo_marko_fullstack",
    name: "Marko Fullstack",
    email: "demo+marko@liferecompiled.com",
    bio:
      "Full-stack demo profile. Interested in connecting UI, backend logic, and real product behavior into one coherent app experience.",
  },
];

const demoPosts = [
  {
    id: "demo_post_ui_details_matter",
    authorId: "demo_mina_frontend",
    title: "Small UI Details Matter",
    category: "Frontend",
    minutesAgo: 1400,
    description:
      "A short reflection on how tiny UI choices make a product feel more intentional and easier to trust.",
    content:
      "Small UI decisions often decide whether a product feels finished or unfinished. A card layout, a loading state, a clear empty message, or a stable mobile view can completely change how users experience the same feature. The functionality may be simple, but presentation gives it structure. That is why I like treating UI polish as product work, not decoration.",
    tags: ["User Experience", "Frontend", "Product Polish"],
  },
  {
    id: "demo_post_backend_trust",
    authorId: "demo_luka_backend",
    title: "Trust Starts in the Backend",
    category: "Backend",
    minutesAgo: 1320,
    description:
      "A demo post about why permissions, server-side ownership, and data consistency matter before adding more features.",
    content:
      "A product can look polished and still feel fragile if the backend rules are unclear. Ownership, permissions, idempotency, and predictable data updates are not glamorous, but they create trust. When users comment, react, save, or report something, the app should behave the same way every time. That kind of boring reliability is a real feature.",
    tags: ["Backend", "Firebase", "Data Integrity"],
  },
  {
    id: "demo_post_empty_states",
    authorId: "demo_sara_ux",
    title: "Empty States Are Part of the Product",
    category: "User Experience",
    minutesAgo: 1240,
    description:
      "Good empty states explain what happened and help users understand the next step.",
    content:
      "An empty state is not just a blank area waiting for data. It is a moment where the product either guides the user or leaves them confused. A good empty state explains what is missing, why it matters, and what the user can do next. In a community-style app, this matters even more because empty feeds, empty saved lists, and empty profiles all carry meaning.",
    tags: ["UX", "Empty States", "Product"],
  },
  {
    id: "demo_post_staging_saves_time",
    authorId: "demo_nikola_devops",
    title: "Staging Saves Future You",
    category: "DevOps",
    minutesAgo: 1180,
    description:
      "A practical note on why a staging environment makes risky changes easier to test before production.",
    content:
      "Staging is not just a professional checkbox. It gives you a place to break things before users do. Rules changes, Cloud Functions, indexes, seed scripts, and cleanup flows all become safer when they can be tested outside production first. Even for a solo project, staging reduces stress because every risky operation gets a rehearsal.",
    tags: ["Staging", "Deployment", "Firebase"],
  },
  {
    id: "demo_post_mvp_scope",
    authorId: "demo_ana_product",
    title: "MVP Scope Needs a Cutline",
    category: "Product",
    minutesAgo: 1100,
    description:
      "A product note about deciding what belongs in the MVP and what should wait.",
    content:
      "A healthy MVP is not the version with every possible feature. It is the version where the core promise is clear and the remaining work has a name. A cutline protects the product from endless polish and protects the builder from never shipping. The important part is not ignoring ideas. It is deciding which ideas belong later.",
    tags: ["MVP", "Product Thinking", "Planning"],
  },
  {
    id: "demo_post_fullstack_loop",
    authorId: "demo_marko_fullstack",
    title: "The Full-Stack Feedback Loop",
    category: "Fullstack",
    minutesAgo: 1040,
    description:
      "A demo post about how frontend decisions and backend constraints shape each other.",
    content:
      "Full-stack work is a feedback loop. The UI reveals what the backend must support, and the backend reveals what the UI can safely promise. Reactions need counts. Comments need ownership. Saved posts need snapshots. Reports need moderation. When those pieces are designed together, the app feels less like separate screens and more like one product.",
    tags: ["Fullstack", "Architecture", "React"],
  },
  {
    id: "demo_post_comments_thread",
    authorId: "demo_sara_ux",
    title: "Comment Threads Should Stay Readable",
    category: "User Experience",
    minutesAgo: 960,
    description:
      "Nested discussions are useful only if the layout remains calm on mobile and desktop.",
    content:
      "Replies can quickly become messy if every level moves further to the right. The user should be able to follow the conversation without fighting the layout. A subtle thread hint, clear author names, and stable spacing are usually better than aggressive visual nesting. Readability matters more than showing off structure.",
    tags: ["Comments", "Mobile UX", "Readability"],
  },
  {
    id: "demo_post_reactions_meaning",
    authorId: "demo_mina_frontend",
    title: "Reactions Need Meaning",
    category: "Community",
    minutesAgo: 900,
    description:
      "A quick thought on reactions as signals, not just decorative counters.",
    content:
      "Reactions are small, but they shape behavior. If every reaction means the same thing, users stop thinking about them. When each reaction has a clear role, the product can surface better signals: ideas that inspire, posts that get attention, and contributors who help others. A good reaction system should feel simple on the surface and consistent underneath.",
    tags: ["Reactions", "Community", "Badges"],
  },
  {
    id: "demo_post_saved_posts",
    authorId: "demo_ana_product",
    title: "Saved Posts Are a Memory Layer",
    category: "Product",
    minutesAgo: 820,
    description:
      "Why saved posts are more than a bookmark button inside a content platform.",
    content:
      "Saving a post is a small action, but it changes how users relate to the product. It lets them build a personal memory layer inside the app. That means the saved experience should handle updates, missing posts, and undo flows carefully. A saved list should feel reliable, not like a fragile shortcut.",
    tags: ["Saved Posts", "Product", "UX"],
  },
  {
    id: "demo_post_rules_are_features",
    authorId: "demo_luka_backend",
    title: "Security Rules Are Product Features",
    category: "Backend",
    minutesAgo: 760,
    description:
      "A backend-focused post about treating Firestore rules as part of the user experience.",
    content:
      "Security rules are not invisible implementation details. They decide what users can see, edit, delete, save, report, and trust. A good rule set protects users from each other and protects the app from accidental damage. When permissions match the product model, the UI becomes easier to reason about.",
    tags: ["Firestore Rules", "Security", "Backend"],
  },
  {
    id: "demo_post_release_notes",
    authorId: "demo_nikola_devops",
    title: "Release Notes Keep the Story Clear",
    category: "DevOps",
    minutesAgo: 680,
    description:
      "A note on why even small projects benefit from a clear changelog and release rhythm.",
    content:
      "A project moves faster when the story stays clear. Release notes help you understand what changed, why it changed, and what still needs attention. They are especially useful near MVP close-out, when small fixes and polish tasks can blur together. The changelog becomes a map, not just a history.",
    tags: ["Release Notes", "CI", "Documentation"],
  },
  {
    id: "demo_post_profile_pages",
    authorId: "demo_marko_fullstack",
    title: "Profiles Give Content a Face",
    category: "Community",
    minutesAgo: 600,
    description:
      "A demo post about why author profiles make community content feel more connected.",
    content:
      "A feed is easier to trust when posts are connected to authors. Profiles give context: who wrote this, what they care about, and what else they have shared. Even a simple profile page can make a small community app feel more complete. The goal is not complexity. It is continuity.",
    tags: ["Profiles", "Community", "UX"],
  },
  {
    id: "demo_post_mobile_first",
    authorId: "demo_mina_frontend",
    title: "Mobile Polish Exposes Real Problems",
    category: "Frontend",
    minutesAgo: 520,
    description:
      "Mobile testing often reveals layout and flow problems that desktop hides.",
    content:
      "Desktop can hide weak layout decisions because there is more space to breathe. Mobile is stricter. Long titles, overflowing tags, sticky toolbars, sheets, and action rows all show whether the design system is actually stable. That is why mobile polish is not just visual work. It is a stress test for the whole interface.",
    tags: ["Mobile", "Responsive Design", "Frontend"],
  },
  {
    id: "demo_post_debugging_confidence",
    authorId: "demo_luka_backend",
    title: "Debugging Gets Easier with Better Signals",
    category: "Backend",
    minutesAgo: 460,
    description:
      "Good logs, stable IDs, and predictable states make bugs easier to understand.",
    content:
      "Debugging is not only about fixing a bug after it appears. It is also about designing the system so the bug leaves useful evidence. Stable document IDs, structured logs, predictable status fields, and small acceptance checks make issues less mysterious. The goal is not to avoid every bug. It is to make bugs easier to catch and explain.",
    tags: ["Debugging", "Logs", "Reliability"],
  },
  {
    id: "demo_post_building_in_public",
    authorId: "demo_ana_product",
    title: "Building in Public Requires Structure",
    category: "Personal Development",
    minutesAgo: 390,
    description:
      "Sharing progress is easier when the project has clear structure and honest checkpoints.",
    content:
      "Building in public does not mean showing every unfinished thought. It means making progress visible in a way that others can understand. Structure helps: clear releases, documented decisions, visible tradeoffs, and honest notes about what still needs work. That turns a messy learning process into proof of growth.",
    tags: ["Building in Public", "Consistency", "Growth"],
  },
];

const commentPlan = [
  {
    id: "demo_comment_001",
    postId: "demo_post_ui_details_matter",
    userId: "demo_sara_ux",
    minutesAgo: 1335,
    content:
      "This is exactly why a simple card can feel premium or unfinished depending on spacing, hierarchy, and loading states.",
    replies: [
      {
        id: "demo_comment_002",
        userId: "demo_mina_frontend",
        minutesAgo: 1328,
        content:
          "Yes. The feature can be small, but the surrounding states decide whether it feels trustworthy.",
      },
    ],
  },
  {
    id: "demo_comment_003",
    postId: "demo_post_backend_trust",
    userId: "demo_marko_fullstack",
    minutesAgo: 1260,
    content:
      "The biggest shift for me was realizing that backend consistency is also a UX feature.",
    replies: [
      {
        id: "demo_comment_004",
        userId: "demo_luka_backend",
        minutesAgo: 1252,
        content:
          "Exactly. Users may not see the backend, but they feel every inconsistent edge case.",
      },
    ],
  },
  {
    id: "demo_comment_005",
    postId: "demo_post_empty_states",
    userId: "demo_ana_product",
    minutesAgo: 1190,
    content:
      "Empty states are where product thinking shows. They tell users whether the app understands their situation.",
    replies: [],
  },
  {
    id: "demo_comment_006",
    postId: "demo_post_staging_saves_time",
    userId: "demo_luka_backend",
    minutesAgo: 1110,
    content:
      "Staging is especially useful when rules and functions are involved. Production should not be the first rehearsal.",
    replies: [
      {
        id: "demo_comment_007",
        userId: "demo_nikola_devops",
        minutesAgo: 1103,
        content:
          "Exactly. The less exciting the production deploy feels, the better the process probably is.",
      },
    ],
  },
  {
    id: "demo_comment_008",
    postId: "demo_post_mvp_scope",
    userId: "demo_mina_frontend",
    minutesAgo: 1050,
    content:
      "A cutline helps a lot when every polish idea feels important at the same time.",
    replies: [
      {
        id: "demo_comment_009",
        userId: "demo_ana_product",
        minutesAgo: 1043,
        content:
          "That is the hard part. Good ideas still need timing, otherwise the MVP never lands.",
      },
    ],
  },
  {
    id: "demo_comment_010",
    postId: "demo_post_fullstack_loop",
    userId: "demo_sara_ux",
    minutesAgo: 990,
    content:
      "This is why frontend and backend cannot be planned in isolation forever. The product behavior is shared.",
    replies: [],
  },
  {
    id: "demo_comment_011",
    postId: "demo_post_comments_thread",
    userId: "demo_marko_fullstack",
    minutesAgo: 910,
    content:
      "Deep nesting looks logical in data, but it can become painful in the interface really fast.",
    replies: [
      {
        id: "demo_comment_012",
        userId: "demo_sara_ux",
        minutesAgo: 904,
        content:
          "Exactly. The user is reading a conversation, not inspecting a tree structure.",
      },
      {
        id: "demo_comment_013",
        userId: "demo_mina_frontend",
        minutesAgo: 896,
        content:
          "A subtle reply rail usually gives enough context without destroying the layout.",
      },
    ],
  },
  {
    id: "demo_comment_014",
    postId: "demo_post_reactions_meaning",
    userId: "demo_ana_product",
    minutesAgo: 850,
    content:
      "When reactions have meaning, they become product signals instead of just decoration.",
    replies: [],
  },
  {
    id: "demo_comment_015",
    postId: "demo_post_saved_posts",
    userId: "demo_nikola_devops",
    minutesAgo: 780,
    content:
      "The ghost card behavior for missing posts is a small detail, but it prevents a lot of confusion.",
    replies: [
      {
        id: "demo_comment_016",
        userId: "demo_ana_product",
        minutesAgo: 772,
        content:
          "Yes, the saved list should feel stable even when the original content changes.",
      },
    ],
  },
  {
    id: "demo_comment_017",
    postId: "demo_post_rules_are_features",
    userId: "demo_sara_ux",
    minutesAgo: 720,
    content:
      "Rules are invisible until they are wrong. Then they become the whole experience.",
    replies: [
      {
        id: "demo_comment_018",
        userId: "demo_luka_backend",
        minutesAgo: 714,
        content:
          "That is a perfect way to put it. Good permissions should feel boring.",
      },
    ],
  },
  {
    id: "demo_comment_019",
    postId: "demo_post_release_notes",
    userId: "demo_ana_product",
    minutesAgo: 640,
    content:
      "Release notes also help you explain the project later. They show the reasoning behind the work.",
    replies: [],
  },
  {
    id: "demo_comment_020",
    postId: "demo_post_profile_pages",
    userId: "demo_mina_frontend",
    minutesAgo: 560,
    content:
      "Profiles make even a small feed feel less anonymous. That changes the whole tone of the app.",
    replies: [
      {
        id: "demo_comment_021",
        userId: "demo_marko_fullstack",
        minutesAgo: 552,
        content:
          "Exactly. The profile does not need to be complex, it just needs to connect the content.",
      },
    ],
  },
  {
    id: "demo_comment_022",
    postId: "demo_post_mobile_first",
    userId: "demo_sara_ux",
    minutesAgo: 500,
    content:
      "Mobile is where layout shortcuts get exposed. It is a very honest testing environment.",
    replies: [
      {
        id: "demo_comment_023",
        userId: "demo_nikola_devops",
        minutesAgo: 492,
        content:
          "And it catches problems early before they become user feedback later.",
      },
    ],
  },
  {
    id: "demo_comment_024",
    postId: "demo_post_debugging_confidence",
    userId: "demo_marko_fullstack",
    minutesAgo: 430,
    content:
      "Stable IDs and clear logs make debugging feel like investigation instead of guessing.",
    replies: [],
  },
  {
    id: "demo_comment_025",
    postId: "demo_post_building_in_public",
    userId: "demo_luka_backend",
    minutesAgo: 360,
    content:
      "Structure makes the public part easier because you can point to decisions instead of explaining everything from memory.",
    replies: [
      {
        id: "demo_comment_026",
        userId: "demo_ana_product",
        minutesAgo: 352,
        content:
          "Exactly. The process becomes part of the proof, not just the final screen.",
      },
    ],
  },
];

const savedPostIdsForOwner = [
  "demo_post_ui_details_matter",
  "demo_post_saved_posts",
  "demo_post_mobile_first",
  "demo_post_building_in_public",
];

function buildUserDoc(user, index) {
  return {
    badges: {
      topContributor: false,
    },
    bio: user.bio,
    createdAt: minutesAgo(1600 - index * 10),
    email: user.email,
    name: user.name,
    profilePicture: "",
    role: "user",
    status: "Active",
    ...baseSeedFields(),
  };
}

function buildPostDoc(post) {
  const createdAt = minutesAgo(post.minutesAgo);

  return {
    badges: {
      mostInspiring: false,
      trending: false,
    },
    category: post.category,
    content: post.content,
    createdAt,
    deleted: false,
    deletedAt: null,
    description: post.description,
    lastHotAt: null,
    locked: false,
    reactionCounts: {
      hot: 0,
      idea: 0,
      powerup: 0,
    },
    tags: post.tags.map(tag),
    title: post.title,
    title_lc: makeTitleLc(post.title),
    updatedAt: null,
    userId: post.authorId,
    ...baseSeedFields(),
  };
}

function buildCommentDocs() {
  const docs = [];

  for (const root of commentPlan) {
    docs.push({
      id: root.id,
      data: {
        content: root.content,
        deleted: false,
        deletedAt: null,
        likes: [],
        parentID: null,
        postID: root.postId,
        timestamp: minutesAgo(root.minutesAgo),
        userID: root.userId,
        ...baseSeedFields(),
      },
    });

    for (const reply of root.replies) {
      docs.push({
        id: reply.id,
        data: {
          content: reply.content,
          deleted: false,
          deletedAt: null,
          likes: [],
          parentID: root.id,
          postID: root.postId,
          timestamp: minutesAgo(reply.minutesAgo),
          userID: reply.userId,
          ...baseSeedFields(),
        },
      });
    }
  }

  return docs;
}

function buildReactionDocs() {
  const userIds = demoUsers.map((user) => user.id);
  const reactions = [];
  const seen = new Set();

  demoPosts.forEach((post, postIndex) => {
    const reactors = userIds.filter((uid) => uid !== post.authorId);
    const shuffled = reactors
      .map((uid, idx) => ({ uid, score: (postIndex + 3) * (idx + 7) }))
      .sort((a, b) => (a.score % 11) - (b.score % 11))
      .map((item) => item.uid);

    const ideaReactors = shuffled.slice(0, 3);
    const hotReactors = shuffled.slice(1, 4);
    const powerupReactors = shuffled.slice(2, 4);

    const addReaction = (userId, reactionType, offset) => {
      if (userId === post.authorId && reactionType === "powerup") return;

      const id = `${post.id}__${userId}__${reactionType}`;
      if (seen.has(id)) return;

      seen.add(id);
      reactions.push({
        id,
        data: {
          postId: post.id,
          userId,
          reactionType,
          createdAt: minutesAgo(post.minutesAgo - offset),
          ...baseSeedFields(),
        },
      });
    };

    ideaReactors.forEach((uid, index) => addReaction(uid, "idea", 20 + index));
    hotReactors.forEach((uid, index) => addReaction(uid, "hot", 30 + index));
    powerupReactors.forEach((uid, index) =>
      addReaction(uid, "powerup", 40 + index)
    );
  });

  return reactions;
}

async function assertNoExistingFullSeed() {
  const existingPosts = await db
    .collection("posts")
    .where("seedBatchId", "==", SEED_BATCH_ID)
    .limit(1)
    .get();

  if (!existingPosts.empty) {
    throw new Error(
      `Seed batch ${SEED_BATCH_ID} already exists. Run cleanup first or inspect Firestore.`
    );
  }
}

async function commitInChunks(operations, label) {
  const CHUNK_SIZE = 400;

  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const chunk = operations.slice(i, i + CHUNK_SIZE);
    const batch = db.batch();

    chunk.forEach((operation) => {
      batch.set(operation.ref, operation.data);
    });

    await batch.commit();
    console.log(`[seed] Wrote ${chunk.length} ${label} operation(s).`);
  }
}

async function seedFullDemoData() {
  console.log(`[seed] Starting ${SEED_BATCH_ID}`);
  console.log(`[seed] Project: ${serviceAccount.project_id}`);

  await assertNoExistingFullSeed();

  const operations = [];

  demoUsers.forEach((user, index) => {
    operations.push({
      ref: db.collection("users").doc(user.id),
      data: buildUserDoc(user, index),
    });
  });

  demoPosts.forEach((post) => {
    operations.push({
      ref: db.collection("posts").doc(post.id),
      data: buildPostDoc(post),
    });
  });

  buildCommentDocs().forEach((comment) => {
    operations.push({
      ref: db.collection("comments").doc(comment.id),
      data: comment.data,
    });
  });

  savedPostIdsForOwner.forEach((postId, index) => {
    const post = demoPosts.find((item) => item.id === postId);
    const createdAt = minutesAgo(post.minutesAgo);

    operations.push({
      ref: db
        .collection("users")
        .doc(OWNER_UID)
        .collection("savedPosts")
        .doc(postId),
      data: {
        postTitleAtSave: post.title,
        postUpdatedAtAtSave: createdAt,
        savedAt: minutesAgo(300 - index * 15),
        ...baseSeedFields(),
      },
    });
  });

  buildReactionDocs().forEach((reaction) => {
    operations.push({
      ref: db.collection("reactions").doc(reaction.id),
      data: reaction.data,
    });
  });

  await commitInChunks(operations, "seed");

  console.log("[seed] Done.");
  console.log(`[seed] Users: ${demoUsers.length}`);
  console.log(`[seed] Posts: ${demoPosts.length}`);
  console.log(`[seed] Comments: ${buildCommentDocs().length}`);
  console.log(`[seed] Reactions: ${buildReactionDocs().length}`);
  console.log(`[seed] Saved refs for owner: ${savedPostIdsForOwner.length}`);
  console.log("");
  console.log("[seed] Wait a few seconds, then verify reactionCounts on demo posts.");
}

seedFullDemoData().catch((error) => {
  console.error("[seed] Failed:", error);
  process.exit(1);
});
