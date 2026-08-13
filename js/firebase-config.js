/* Firebase project config for Classroom Mode.
 *
 * Classroom Mode (teacher-hosted sessions, live points, class leaderboard)
 * needs a real backend to sync state across different students' devices —
 * this app uses Firebase (Firestore + Anonymous Auth) for that. Without a
 * configured project, Classroom Mode shows a setup notice instead of
 * connecting; everything else in the app works exactly as before.
 *
 * One-time setup (free tier is enough for a classroom):
 *   1. Go to https://console.firebase.google.com and create a project.
 *   2. Build → Firestore Database → Create database (start in production
 *      mode — the rules below lock it down).
 *   3. Build → Authentication → Sign-in method → enable "Anonymous".
 *   4. Project settings (gear icon) → General → "Your apps" → Add app →
 *      Web (</>) → register it → copy the firebaseConfig object it gives
 *      you into FIREBASE_CONFIG below.
 *   5. Firestore Database → Rules → paste in the contents of
 *      firestore.rules (at the repo root) → Publish.
 *
 * See the README's "Classroom Mode" section for more detail.
 */
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const FIREBASE_CONFIGURED = FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";
