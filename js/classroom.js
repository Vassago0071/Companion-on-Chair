/* Classroom Mode — teacher-hosted sessions with a live class leaderboard and
 * a session-scoped shop. Backed by Firebase (Firestore + Google Sign-In for
 * teachers, Anonymous Auth for students); see js/firebase-config.js for
 * setup. If Firebase isn't configured yet, the Classroom screen shows a
 * setup notice and the rest of the app is unaffected. */

const CLASSROOM_KEY = "focusCompanion.classroom.v1";

const CLASSROOM_THEMES = [
  { id: "classic", label: "Classic" },
  { id: "sunrise", label: "Sunrise" },
  { id: "ocean", label: "Ocean" },
  { id: "forest", label: "Forest" },
  { id: "lavender", label: "Lavender" },
];

/* The six scoring bars a teacher tracks per student. A student's total
 * class points (used for the leaderboard and the class shop) is always the
 * sum of these six -- awardScore() increments both the category and the
 * total atomically so they can never drift apart. */
const SCORE_CATEGORIES = [
  { id: "attention", label: "Attention", icon: "👀" },
  { id: "engagement", label: "Engagement", icon: "🙋" },
  { id: "completion", label: "Completion of Work", icon: "✅" },
  { id: "obedience", label: "Obedience", icon: "🧭" },
  { id: "friendliness", label: "Friendliness", icon: "🤝" },
  { id: "bonus", label: "Bonus", icon: "⭐" },
];

function emptyScores() {
  const scores = {};
  SCORE_CATEGORIES.forEach((c) => (scores[c.id] = 0));
  return scores;
}

let firebaseApp = null;
let db = null;
let auth = null;
let storage = null;
let googleProvider = null;
let currentUid = null;
let rosterUnsubscribe = null;
let classDocUnsubscribe = null;
let studentRosterCache = [];
let classroomSession = loadClassroomSession();

function loadClassroomSession() {
  try {
    return JSON.parse(localStorage.getItem(CLASSROOM_KEY)) || null;
  } catch (e) {
    return null;
  }
}

function saveClassroomSession(data) {
  classroomSession = data;
  if (data) localStorage.setItem(CLASSROOM_KEY, JSON.stringify(data));
  else localStorage.removeItem(CLASSROOM_KEY);
}

/* ------------------------------ Firebase glue ----------------------------- */

function initFirebase() {
  if (!FIREBASE_CONFIGURED || firebaseApp) return firebaseApp;
  firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.firestore();
  auth = firebase.auth();
  storage = firebase.storage();
  return firebaseApp;
}

function ensureAuth() {
  return new Promise((resolve, reject) => {
    if (!FIREBASE_CONFIGURED) {
      reject(new Error("Classroom Mode isn't set up yet — see js/firebase-config.js."));
      return;
    }
    initFirebase();
    let unsubscribe = () => {};
    unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        currentUid = user.uid;
        unsubscribe();
        resolve(user.uid);
      }
    });
    auth.signInAnonymously().catch((err) => {
      unsubscribe();
      reject(err);
    });
  });
}

/* Waits for Firebase's own persisted auth session (if any) to resolve,
 * without forcing anonymous sign-in. Used on page load to see whether a
 * teacher is still signed in with Google from a previous visit. */
function waitForAuthReady() {
  return new Promise((resolve) => {
    if (!FIREBASE_CONFIGURED) {
      resolve(null);
      return;
    }
    initFirebase();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

function ensureTeacherAuth() {
  return new Promise((resolve, reject) => {
    if (!FIREBASE_CONFIGURED) {
      reject(new Error("Classroom Mode isn't set up yet — see js/firebase-config.js."));
      return;
    }
    initFirebase();
    if (!googleProvider) googleProvider = new firebase.auth.GoogleAuthProvider();
    auth
      .signInWithPopup(googleProvider)
      .then((result) => resolve(result.user))
      .catch(reject);
  });
}

function isSignedInTeacher() {
  return !!(auth && auth.currentUser && !auth.currentUser.isAnonymous);
}

function generateClassCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function createClassInFirestore(className) {
  if (!isSignedInTeacher()) throw new Error("Sign in first, then host a class.");
  const uid = auth.currentUser.uid;
  const code = generateClassCode();
  const ref = await db.collection("classes").add({
    name: className,
    code,
    teacherUid: uid,
    active: true,
    background: "classic",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return { classId: ref.id, code };
}

async function findClassByCode(code) {
  initFirebase(); // this is a public read and doesn't need ensureAuth(), but db must exist
  const snap = await db
    .collection("classes")
    .where("code", "==", code.toUpperCase())
    .where("active", "==", true)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { classId: doc.id, ...doc.data() };
}

async function joinClassInFirestore(classId, displayName) {
  const uid = await ensureAuth();
  const ref = db.collection("classes").doc(classId).collection("students").doc(uid);
  const existing = await ref.get();
  if (existing.exists) {
    // Rejoining (e.g. page reload, or coming back another day) — refresh only
    // the display name. The companion/customization picked the first time a
    // student joined THIS class stays locked to this class forever, even if
    // their personal companion has since changed — that's how a student ends
    // up with a different character per class to track progress in each.
    await ref.update({ name: displayName });
  } else {
    const companion = getCompanion(state.companionId);
    const customization = getCustomization(state.companionId);
    await ref.set({
      name: displayName,
      companionId: companion.id,
      customization,
      points: 0,
      scores: emptyScores(),
      bonusLog: [],
      ownedDecor: [],
      ownedAccessories: [],
      equippedAccessories: {},
      joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }
  return uid;
}

function listenToRoster(classId, callback) {
  return db
    .collection("classes")
    .doc(classId)
    .collection("students")
    .orderBy("points", "desc")
    .onSnapshot((snap) => callback(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))));
}

/* Adjusts one of the six score bars for a student. Total class points (the
 * leaderboard/shop currency) is incremented by the same delta in the same
 * write, so it always equals the sum of the six bars. Giving bonus points
 * requires a short reason, logged to bonusLog for the "why bonus was given"
 * history. */
async function awardScore(classId, studentUid, category, delta, bonusTitle) {
  const ref = db.collection("classes").doc(classId).collection("students").doc(studentUid);
  const update = {
    [`scores.${category}`]: firebase.firestore.FieldValue.increment(delta),
    points: firebase.firestore.FieldValue.increment(delta),
  };
  if (category === "bonus") {
    update.bonusLog = firebase.firestore.FieldValue.arrayUnion({
      title: bonusTitle || "Bonus",
      amount: delta,
      at: Date.now(),
    });
  }
  await ref.update(update);
}

async function buyClassDecor(classId, studentUid, item) {
  const ref = db.collection("classes").doc(classId).collection("students").doc(studentUid);
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const data = doc.data();
    if (!data) throw new Error("not-in-class");
    if ((data.ownedDecor || []).includes(item.id)) {
      return { status: "owned", points: data.points, ownedDecor: data.ownedDecor };
    }
    if ((data.points || 0) < item.price) throw new Error("not-enough-points");
    const points = data.points - item.price;
    const ownedDecor = [...(data.ownedDecor || []), item.id];
    tx.update(ref, { points, ownedDecor });
    return { status: "bought", points, ownedDecor };
  });
}

async function buyClassAccessory(classId, studentUid, item) {
  const ref = db.collection("classes").doc(classId).collection("students").doc(studentUid);
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const data = doc.data();
    if (!data) throw new Error("not-in-class");
    const ownedAccessories = data.ownedAccessories || [];
    if (ownedAccessories.includes(item.id)) {
      return { status: "owned", points: data.points, ownedAccessories, equippedAccessories: data.equippedAccessories || {} };
    }
    if ((data.points || 0) < item.price) throw new Error("not-enough-points");
    const points = data.points - item.price;
    const nextOwned = [...ownedAccessories, item.id];
    // Buying an item equips it immediately -- one purchase, one visible result.
    const equippedAccessories = { ...(data.equippedAccessories || {}), [item.slot]: item.id };
    tx.update(ref, { points, ownedAccessories: nextOwned, equippedAccessories });
    return { status: "bought", points, ownedAccessories: nextOwned, equippedAccessories };
  });
}

async function equipAccessory(classId, studentUid, item) {
  const ref = db.collection("classes").doc(classId).collection("students").doc(studentUid);
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const data = doc.data();
    if (!data) throw new Error("not-in-class");
    const ownedAccessories = data.ownedAccessories || [];
    if (!ownedAccessories.includes(item.id)) throw new Error("not-owned");
    const current = data.equippedAccessories || {};
    const isEquipped = current[item.slot] === item.id;
    const equippedAccessories = { ...current };
    if (isEquipped) {
      delete equippedAccessories[item.slot];
    } else {
      equippedAccessories[item.slot] = item.id;
    }
    tx.update(ref, { equippedAccessories });
    return { status: isEquipped ? "unequipped" : "equipped", equippedAccessories };
  });
}

async function endClassInFirestore(classId) {
  await db.collection("classes").doc(classId).update({ active: false });
}

function listenToClassDoc(classId, callback) {
  return db
    .collection("classes")
    .doc(classId)
    .onSnapshot((doc) => callback(doc.exists ? { classId: doc.id, ...doc.data() } : null));
}

async function updateClassBackground(classId, themeId) {
  await db.collection("classes").doc(classId).update({ background: themeId });
}

/* Class timer: lives entirely in Firestore (startedAtMs + durationSec, not a
 * running setInterval anywhere), so it keeps counting down for students
 * exactly the same whether or not the teacher's tab is still open. */
async function startClassTimer(classId, durationMin) {
  await db.collection("classes").doc(classId).update({
    classTimer: { mode: "pomodoro", durationSec: durationMin * 60, startedAtMs: Date.now(), running: true },
  });
}

async function stopClassTimer(classId, currentTimer) {
  const merged = currentTimer ? { ...currentTimer, running: false } : null;
  await db.collection("classes").doc(classId).update({ classTimer: merged });
}

/* Lesson materials: notes/homework text plus uploaded files (Firebase
 * Storage), both stored under the class doc's `lesson` field so they ride
 * along on the same live class-doc listener as the theme and timer. */
async function saveLessonNotes(classId, notes) {
  const merged = { files: [], ...currentLessonData, notes };
  await db.collection("classes").doc(classId).update({ lesson: merged });
}

async function uploadLessonFile(classId, file, onProgress) {
  const path = `classes/${classId}/lesson/${Date.now()}-${file.name}`;
  const task = storage.ref(path).put(file);
  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        if (onProgress) onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      },
      reject,
      async () => {
        try {
          const url = await task.snapshot.ref.getDownloadURL();
          resolve({ name: file.name, url, path, size: file.size, uploadedAt: Date.now() });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

async function addLessonFile(classId, fileMeta) {
  const merged = {
    notes: "",
    ...currentLessonData,
    files: [...((currentLessonData && currentLessonData.files) || []), fileMeta],
  };
  await db.collection("classes").doc(classId).update({ lesson: merged });
}

async function removeLessonFile(classId, fileMeta) {
  const merged = {
    notes: "",
    ...currentLessonData,
    files: ((currentLessonData && currentLessonData.files) || []).filter((f) => f.path !== fileMeta.path),
  };
  await db.collection("classes").doc(classId).update({ lesson: merged });
  try {
    await storage.ref(fileMeta.path).delete();
  } catch (err) {
    /* file already gone or storage unreachable — the Firestore removal above still succeeded */
  }
}

async function listMyClasses() {
  const uid = auth.currentUser.uid;
  const snap = await db.collection("classes").where("teacherUid", "==", uid).get();
  const classes = snap.docs.map((d) => ({ classId: d.id, ...d.data() }));
  classes.sort((a, b) => {
    const at = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
    const bt = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
    return bt - at;
  });
  return classes;
}

/* -------------------------------- UI wiring -------------------------------- */

function classroomEl(id) {
  return document.getElementById(id);
}

function showClassroomNotice(message) {
  const notice = classroomEl("firebase-setup-notice");
  if (!notice) return;
  if (message) {
    notice.textContent = message;
    notice.classList.remove("hidden");
  } else {
    notice.classList.add("hidden");
  }
}

function openClassroomHome() {
  showOnlyScreen("screen-classroom-home");
  showClassroomNotice(
    FIREBASE_CONFIGURED
      ? ""
      : "⚠️ Classroom Mode needs a Firebase project connected first. See js/firebase-config.js and the README for setup steps."
  );
  classroomEl("btn-host-class").disabled = !FIREBASE_CONFIGURED;
  classroomEl("btn-join-class").disabled = !FIREBASE_CONFIGURED;
}

function renderRoster(containerId, students, { highlightUid, isTeacher, classId } = {}) {
  const wrap = classroomEl(containerId);
  wrap.innerHTML = "";
  if (students.length === 0) {
    wrap.innerHTML = `<p class="task-empty">No one has joined yet.</p>`;
    return;
  }
  students.forEach((s, idx) => {
    const companion = getCompanion(s.companionId);
    const artCustom = { ...s.customization, accessories: s.equippedAccessories || {} };
    const canViewScores = isTeacher || s.uid === highlightUid;
    const card = document.createElement("div");
    card.className = "roster-card" + (s.uid === highlightUid ? " me" : "");
    card.innerHTML = `
      <div class="roster-rank">#${idx + 1}</div>
      <div class="roster-art">${renderCompanionArt(companion, "idle", artCustom)}</div>
      <div class="roster-name">${escapeHTML(s.name || "Student")}</div>
      <div class="roster-points">${s.points || 0} 🏅</div>
      ${canViewScores ? `<button class="ctrl-btn score-open-btn">📊 ${isTeacher ? "Scores" : "My Scores"}</button>` : ""}
    `;
    if (canViewScores) {
      card.querySelector(".score-open-btn").addEventListener("click", () => {
        openScoreModal(classId, s, isTeacher);
      });
    }
    wrap.appendChild(card);
  });
}

/* ------------------------- per-student score modal ----------------------- */
let scoringContext = null; // { classId, studentUid, isTeacher }

function openScoreModal(classId, student, isTeacher) {
  scoringContext = { classId, studentUid: student.uid, isTeacher };
  classroomEl("score-modal-name").textContent = `${student.name || "Student"}'s Scores`;
  classroomEl("score-bonus-form").classList.toggle("hidden", !isTeacher);
  classroomEl("score-bonus-title").value = "";
  renderScoreBars(student, isTeacher);
  renderBonusLog(student.bonusLog || []);
  classroomEl("score-total-points").textContent = student.points || 0;
  openModal("modal-student-score");
}

function renderScoreBars(student, isTeacher) {
  const wrap = classroomEl("score-bars");
  const scores = student.scores || {};
  wrap.innerHTML = "";
  SCORE_CATEGORIES.filter((c) => c.id !== "bonus").forEach((cat) => {
    const val = scores[cat.id] || 0;
    const row = document.createElement("div");
    row.className = "score-row";
    row.innerHTML = `
      <span class="score-label">${cat.icon} ${cat.label}</span>
      <span class="score-value">${val}</span>
      ${
        isTeacher
          ? `<div class="score-row-btns">
        <button class="ctrl-btn score-adj" data-cat="${cat.id}" data-delta="-1">-1</button>
        <button class="ctrl-btn score-adj" data-cat="${cat.id}" data-delta="1">+1</button>
      </div>`
          : ""
      }
    `;
    if (isTeacher) {
      row.querySelectorAll(".score-adj").forEach((btn) => {
        btn.addEventListener("click", () => {
          awardScore(scoringContext.classId, scoringContext.studentUid, btn.dataset.cat, Number(btn.dataset.delta)).catch(
            (err) => alert("Could not update score: " + err.message)
          );
        });
      });
    }
    wrap.appendChild(row);
  });
  const bonusRow = document.createElement("div");
  bonusRow.className = "score-row";
  bonusRow.innerHTML = `<span class="score-label">⭐ Bonus</span><span class="score-value">${scores.bonus || 0}</span>`;
  wrap.appendChild(bonusRow);
}

function renderBonusLog(log) {
  const wrap = classroomEl("score-bonus-log");
  if (!log || log.length === 0) {
    wrap.innerHTML = `<p class="task-empty">No bonus points given yet.</p>`;
    return;
  }
  wrap.innerHTML =
    `<h4>Bonus history</h4>` +
    log
      .slice()
      .reverse()
      .slice(0, 10)
      .map((e) => `<div class="bonus-log-entry">+${e.amount} — ${escapeHTML(e.title)}</div>`)
      .join("");
}

function giveBonus(amount) {
  if (!scoringContext) return;
  const input = classroomEl("score-bonus-title");
  const title = input.value.trim();
  if (!title) {
    alert("Enter a reason for the bonus points first.");
    return;
  }
  awardScore(scoringContext.classId, scoringContext.studentUid, "bonus", amount, title).catch((err) => {
    alert("Could not give bonus: " + err.message);
  });
  input.value = "";
}

/* Keeps the score modal's bars/log in sync with the live roster listener,
 * so a teacher watching a student's scores sees +/- clicks reflected right
 * away without having to close and reopen the modal. */
function refreshScoreModalIfOpen(students) {
  if (!scoringContext) return;
  const modal = classroomEl("modal-student-score");
  if (!modal || modal.classList.contains("hidden")) return;
  const student = students.find((s) => s.uid === scoringContext.studentUid);
  if (!student) return;
  renderScoreBars(student, scoringContext.isTeacher);
  renderBonusLog(student.bonusLog || []);
  classroomEl("score-total-points").textContent = student.points || 0;
}

function applyClassroomBackground(screenId, themeId) {
  const node = classroomEl(screenId);
  if (!node) return;
  CLASSROOM_THEMES.forEach((t) => node.classList.remove("classroom-bg-" + t.id));
  node.classList.add("classroom-bg-" + (themeId || "classic"));
}

function renderThemePicker(classId, currentTheme) {
  const wrap = classroomEl("teacher-theme-picker");
  if (!wrap) return;
  wrap.innerHTML = "";
  CLASSROOM_THEMES.forEach((t) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-swatch theme-swatch-" + t.id + (t.id === (currentTheme || "classic") ? " active" : "");
    btn.title = t.label;
    btn.addEventListener("click", () => {
      updateClassBackground(classId, t.id).catch((err) => alert("Could not change theme: " + err.message));
    });
    wrap.appendChild(btn);
  });
}

/* Class timer display/ticking. The countdown is recomputed every second
 * from the cached classTimer doc data (startedAtMs + durationSec) rather
 * than driven by any server push, so it ticks smoothly between snapshots. */
let currentClassTimerData = null;
let classTimerTickHandle = null;
let selectedClassDurationMin = 25;

function formatClassTimer(sec) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function computeRemainingSec(classTimer) {
  if (!classTimer || !classTimer.running) return null;
  const elapsed = Math.floor((Date.now() - classTimer.startedAtMs) / 1000);
  return Math.max(0, classTimer.durationSec - elapsed);
}

function renderClassTimerDisplays() {
  const remaining = computeRemainingSec(currentClassTimerData);
  const teacherDisplay = classroomEl("teacher-class-timer-display");
  if (teacherDisplay) {
    teacherDisplay.textContent = remaining === null ? "Not running" : remaining === 0 ? "Time's up!" : formatClassTimer(remaining);
  }
  const studentDisplay = classroomEl("student-class-timer-display");
  if (studentDisplay) {
    studentDisplay.textContent =
      remaining === null ? "" : `⏱ Class focusing — ${remaining === 0 ? "Time's up!" : formatClassTimer(remaining)}`;
  }
}

function startClassTimerTicking() {
  if (classTimerTickHandle) return;
  classTimerTickHandle = setInterval(renderClassTimerDisplays, 1000);
}

function stopClassTimerTicking() {
  if (classTimerTickHandle) {
    clearInterval(classTimerTickHandle);
    classTimerTickHandle = null;
  }
  currentClassTimerData = null;
  currentLessonData = null;
  renderClassTimerDisplays();
}

/* Lesson materials rendering. */
let currentLessonData = null;

function renderLessonFileList(container, files, { isTeacher, classId }) {
  if (!container) return;
  if (!files || files.length === 0) {
    container.innerHTML = isTeacher ? "" : `<p class="task-empty">No files shared yet.</p>`;
    return;
  }
  container.innerHTML = "";
  files.forEach((f) => {
    const row = document.createElement("div");
    row.className = "lesson-file-row";
    row.innerHTML = `
      <a href="${f.url}" target="_blank" rel="noopener">📄 ${escapeHTML(f.name)}</a>
      ${isTeacher ? `<button type="button" class="file-remove-btn" title="Remove">✕</button>` : ""}
    `;
    if (isTeacher) {
      row.querySelector(".file-remove-btn").addEventListener("click", () => {
        removeLessonFile(classId, f).catch((err) => alert("Could not remove file: " + err.message));
      });
    }
    container.appendChild(row);
  });
}

function renderTeacherLessonPanel(classId) {
  const notes = (currentLessonData && currentLessonData.notes) || "";
  const notesInput = classroomEl("lesson-notes-input");
  if (notesInput && document.activeElement !== notesInput) notesInput.value = notes;
  renderLessonFileList(classroomEl("teacher-lesson-files"), currentLessonData && currentLessonData.files, {
    isTeacher: true,
    classId,
  });
}

function renderStudentLessonPanel(classId) {
  const notes = (currentLessonData && currentLessonData.notes) || "";
  const notesDisplay = classroomEl("student-lesson-notes");
  if (notesDisplay) notesDisplay.textContent = notes || "No notes shared yet.";
  renderLessonFileList(classroomEl("student-lesson-files"), currentLessonData && currentLessonData.files, {
    isTeacher: false,
    classId,
  });
}

function openTeacherDashboard(classId, className, code) {
  showOnlyScreen("screen-classroom-teacher");
  classroomEl("teacher-class-name").textContent = className;
  classroomEl("teacher-class-code").textContent = code;
  if (rosterUnsubscribe) rosterUnsubscribe();
  if (classDocUnsubscribe) classDocUnsubscribe();
  rosterUnsubscribe = listenToRoster(classId, (students) => {
    renderRoster("teacher-roster", students, { isTeacher: true, classId });
    refreshScoreModalIfOpen(students);
  });
  classDocUnsubscribe = listenToClassDoc(classId, (classData) => {
    if (!classData) return;
    applyClassroomBackground("screen-classroom-teacher", classData.background);
    renderThemePicker(classId, classData.background);
    currentClassTimerData = classData.classTimer || null;
    renderClassTimerDisplays();
    currentLessonData = classData.lesson || { notes: "", files: [] };
    renderTeacherLessonPanel(classId);
  });
  startClassTimerTicking();
}

function openStudentDashboard(classId, className, myUid) {
  showOnlyScreen("screen-classroom-student");
  classroomEl("student-class-name").textContent = className;
  if (rosterUnsubscribe) rosterUnsubscribe();
  if (classDocUnsubscribe) classDocUnsubscribe();
  rosterUnsubscribe = listenToRoster(classId, (students) => {
    studentRosterCache = students;
    renderRoster("student-roster", students, { highlightUid: myUid, classId });
    refreshScoreModalIfOpen(students);
    const me = students.find((s) => s.uid === myUid);
    classroomEl("student-points").textContent = me ? me.points || 0 : 0;
  });
  classDocUnsubscribe = listenToClassDoc(classId, (classData) => {
    if (!classData) return;
    applyClassroomBackground("screen-classroom-student", classData.background);
    currentClassTimerData = classData.classTimer || null;
    renderClassTimerDisplays();
    currentLessonData = classData.lesson || { notes: "", files: [] };
    renderStudentLessonPanel(classId);
  });
  startClassTimerTicking();
}

function renderClassShop(classId, myUid) {
  const grid = classroomEl("class-shop-grid");
  const me = studentRosterCache.find((s) => s.uid === myUid);
  const myPoints = me ? me.points || 0 : 0;
  const owned = me ? me.ownedDecor || [] : [];
  classroomEl("class-shop-points").textContent = myPoints;
  grid.innerHTML = "";
  DECOR.forEach((item) => {
    const isOwned = owned.includes(item.id);
    const card = document.createElement("div");
    card.className = "shop-card" + (isOwned ? " owned" : "");
    card.innerHTML = `
      <div class="shop-icon">${item.icon}</div>
      <div class="shop-name">${item.name}</div>
      <div class="shop-price">${isOwned ? "Owned" : `🏅 ${item.price}`}</div>
      <button class="ctrl-btn ${isOwned ? "" : "primary"}" ${isOwned ? "disabled" : ""}>${
      isOwned ? "In class room" : "Buy"
    }</button>
    `;
    if (!isOwned) {
      card.querySelector("button").addEventListener("click", async () => {
        try {
          const result = await buyClassDecor(classId, myUid, item);
          // Reflect the purchase immediately rather than waiting on the next
          // snapshot — update our local cache with the transaction's result.
          const cached = studentRosterCache.find((s) => s.uid === myUid);
          if (cached) {
            cached.points = result.points;
            cached.ownedDecor = result.ownedDecor;
          }
          classroomEl("student-points").textContent = result.points;
          renderClassShop(classId, myUid);
        } catch (err) {
          alert(err.message === "not-enough-points" ? "Not enough class points yet." : "Could not buy that.");
        }
      });
    }
    grid.appendChild(card);
  });
}

function renderClassAccessoriesShop(classId, myUid) {
  const grid = classroomEl("class-shop-accessories-grid");
  const me = studentRosterCache.find((s) => s.uid === myUid);
  const myPoints = me ? me.points || 0 : 0;
  const owned = me ? me.ownedAccessories || [] : [];
  const equipped = me ? me.equippedAccessories || {} : {};
  classroomEl("class-shop-points").textContent = myPoints;
  grid.innerHTML = "";
  ACCESSORY_CATALOG.forEach((item) => {
    const isOwned = owned.includes(item.id);
    const isEquipped = equipped[item.slot] === item.id;
    const card = document.createElement("div");
    card.className = "shop-card" + (isOwned ? " owned" : "") + (isEquipped ? " equipped" : "");
    card.innerHTML = `
      <div class="shop-icon">${item.icon}</div>
      <div class="shop-name">${item.name}</div>
      <div class="shop-price">${isOwned ? (isEquipped ? "Equipped" : "Owned") : `🏅 ${item.price}`}</div>
      <button class="ctrl-btn ${isOwned && !isEquipped ? "primary" : ""}" ${isEquipped ? "disabled" : ""}>${
      isOwned ? (isEquipped ? "Equipped" : "Wear") : "Buy"
    }</button>
    `;
    const btn = card.querySelector("button");
    if (!isEquipped) {
      btn.addEventListener("click", async () => {
        try {
          const cached = studentRosterCache.find((s) => s.uid === myUid);
          if (isOwned) {
            const result = await equipAccessory(classId, myUid, item);
            if (cached) cached.equippedAccessories = result.equippedAccessories;
          } else {
            const result = await buyClassAccessory(classId, myUid, item);
            if (cached) {
              cached.points = result.points;
              cached.ownedAccessories = result.ownedAccessories;
              cached.equippedAccessories = result.equippedAccessories;
            }
            classroomEl("student-points").textContent = result.points;
          }
          renderClassAccessoriesShop(classId, myUid);
          renderRoster("student-roster", studentRosterCache, { highlightUid: myUid });
        } catch (err) {
          alert(err.message === "not-enough-points" ? "Not enough class points yet." : "Could not do that.");
        }
      });
    }
    grid.appendChild(card);
  });
}

function switchClassShopTab(tab) {
  classroomEl("class-shop-grid").classList.toggle("hidden", tab !== "decor");
  classroomEl("class-shop-accessories-grid").classList.toggle("hidden", tab !== "accessories");
  classroomEl("class-shop-tab-decor").classList.toggle("active", tab === "decor");
  classroomEl("class-shop-tab-accessories").classList.toggle("active", tab === "accessories");
}

async function openMyClasses() {
  showOnlyScreen("screen-my-classes");
  const user = auth.currentUser;
  classroomEl("my-classes-signed-in-as").textContent = `Signed in as ${user.email || user.displayName || "you"}`;
  const list = classroomEl("my-classes-list");
  list.innerHTML = `<p class="task-empty">Loading your classes…</p>`;
  try {
    const classes = await listMyClasses();
    renderMyClassesList(classes);
  } catch (err) {
    list.innerHTML = `<p class="task-empty">Could not load your classes: ${escapeHTML(err.message)}</p>`;
  }
}

function renderMyClassesList(classes) {
  const list = classroomEl("my-classes-list");
  if (classes.length === 0) {
    list.innerHTML = `<p class="task-empty">No classes yet — host your first one below.</p>`;
    return;
  }
  list.innerHTML = "";
  classes.forEach((c) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "my-class-card" + (c.active === false ? " ended" : "");
    card.innerHTML = `
      <div class="my-class-name">${escapeHTML(c.name)}</div>
      <div class="my-class-code">Code: ${escapeHTML(c.code)}</div>
      ${c.active === false ? '<div class="my-class-status">Closed to new joins</div>' : ""}
    `;
    card.addEventListener("click", () => {
      saveClassroomSession({ role: "teacher", classId: c.classId, code: c.code, className: c.name });
      openTeacherDashboard(c.classId, c.name, c.code);
    });
    list.appendChild(card);
  });
}

function wireClassroomEvents() {
  el("btn-classroom").addEventListener("click", openClassroomHome);
  classroomEl("classroom-home-back").addEventListener("click", showSelectScreen);

  classroomEl("btn-host-class").addEventListener("click", () => {
    if (isSignedInTeacher()) {
      openMyClasses();
    } else {
      showOnlyScreen("screen-classroom-teacher-login");
    }
  });
  classroomEl("teacher-login-back").addEventListener("click", openClassroomHome);
  classroomEl("btn-google-signin").addEventListener("click", async () => {
    try {
      await ensureTeacherAuth();
      openMyClasses();
    } catch (err) {
      alert("Could not sign in: " + err.message);
    }
  });

  classroomEl("btn-new-class").addEventListener("click", () => showOnlyScreen("screen-classroom-host"));
  classroomEl("my-classes-back").addEventListener("click", openClassroomHome);
  classroomEl("btn-teacher-signout").addEventListener("click", async () => {
    if (rosterUnsubscribe) rosterUnsubscribe();
    if (classDocUnsubscribe) classDocUnsubscribe();
    stopClassTimerTicking();
    await auth.signOut();
    saveClassroomSession(null);
    showSelectScreen();
  });

  classroomEl("host-back").addEventListener("click", () => openMyClasses());
  classroomEl("host-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = classroomEl("host-class-name").value.trim();
    if (!name) return;
    try {
      const { classId, code } = await createClassInFirestore(name);
      saveClassroomSession({ role: "teacher", classId, code, className: name });
      classroomEl("host-class-name").value = "";
      openTeacherDashboard(classId, name, code);
    } catch (err) {
      alert("Could not create class: " + err.message);
    }
  });

  classroomEl("btn-join-class").addEventListener("click", () => {
    const c = state.companionId ? getCompanion(state.companionId) : null;
    classroomEl("join-companion-name").textContent = c ? c.name : "no companion chosen yet — pick one first";
    showOnlyScreen("screen-classroom-join");
  });
  classroomEl("join-back").addEventListener("click", openClassroomHome);
  classroomEl("join-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.companionId) {
      alert("Pick a companion first, then join the class.");
      showSelectScreen();
      return;
    }
    const code = classroomEl("join-class-code").value.trim().toUpperCase();
    const name = classroomEl("join-display-name").value.trim();
    if (!code || !name) return;
    try {
      const found = await findClassByCode(code);
      if (!found) {
        alert("No active class found with that code.");
        return;
      }
      const uid = await joinClassInFirestore(found.classId, name);
      saveClassroomSession({ role: "student", classId: found.classId, code, className: found.name, studentUid: uid });
      openStudentDashboard(found.classId, found.name, uid);
    } catch (err) {
      alert("Could not join class: " + err.message);
    }
  });

  classroomEl("teacher-back-to-classes").addEventListener("click", () => {
    if (rosterUnsubscribe) rosterUnsubscribe();
    if (classDocUnsubscribe) classDocUnsubscribe();
    stopClassTimerTicking();
    openMyClasses();
  });

  document.querySelectorAll(".class-dur-btn").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll(".class-dur-btn").forEach((x) => x.classList.toggle("active", x === b));
      selectedClassDurationMin = Number(b.dataset.min);
      classroomEl("class-timer-custom-min").value = "";
    })
  );

  classroomEl("class-timer-custom-set").addEventListener("click", () => {
    const input = classroomEl("class-timer-custom-min");
    const minutes = Math.round(Number(input.value));
    if (!minutes || minutes < 1 || minutes > 240) {
      alert("Enter a class length between 1 and 240 minutes.");
      return;
    }
    selectedClassDurationMin = minutes;
    document.querySelectorAll(".class-dur-btn").forEach((x) => x.classList.remove("active"));
  });

  classroomEl("btn-start-class-timer").addEventListener("click", () => {
    if (!classroomSession) return;
    startClassTimer(classroomSession.classId, selectedClassDurationMin).catch((err) => {
      alert("Could not start the class timer: " + err.message);
    });
  });

  classroomEl("btn-stop-class-timer").addEventListener("click", () => {
    if (!classroomSession) return;
    stopClassTimer(classroomSession.classId, currentClassTimerData).catch((err) => {
      alert("Could not stop the class timer: " + err.message);
    });
  });

  classroomEl("teacher-end-class").addEventListener("click", async () => {
    if (!classroomSession) return;
    const ok = confirm(
      "Close this class to new joins? Existing students' points stay saved, and you can keep viewing/awarding points here anytime from My Classes."
    );
    if (!ok) return;
    try {
      await endClassInFirestore(classroomSession.classId);
    } catch (err) {
      alert("Could not close class: " + err.message);
      return;
    }
    if (rosterUnsubscribe) rosterUnsubscribe();
    if (classDocUnsubscribe) classDocUnsubscribe();
    stopClassTimerTicking();
    saveClassroomSession(null);
    openMyClasses();
  });

  classroomEl("student-leave-class").addEventListener("click", () => {
    if (rosterUnsubscribe) rosterUnsubscribe();
    if (classDocUnsubscribe) classDocUnsubscribe();
    stopClassTimerTicking();
    saveClassroomSession(null);
    showSelectScreen();
  });

  classroomEl("student-open-shop").addEventListener("click", () => {
    if (!classroomSession) return;
    renderClassShop(classroomSession.classId, classroomSession.studentUid);
    renderClassAccessoriesShop(classroomSession.classId, classroomSession.studentUid);
    switchClassShopTab("decor");
    openModal("modal-class-shop");
  });
  classroomEl("class-shop-close").addEventListener("click", () => closeModal("modal-class-shop"));
  classroomEl("class-shop-tab-decor").addEventListener("click", () => switchClassShopTab("decor"));
  classroomEl("class-shop-tab-accessories").addEventListener("click", () => switchClassShopTab("accessories"));

  classroomEl("score-modal-close").addEventListener("click", () => {
    closeModal("modal-student-score");
    scoringContext = null;
  });
  classroomEl("score-bonus-give-1").addEventListener("click", () => giveBonus(1));
  classroomEl("score-bonus-give-5").addEventListener("click", () => giveBonus(5));

  classroomEl("btn-save-lesson-notes").addEventListener("click", () => {
    if (!classroomSession) return;
    const notes = classroomEl("lesson-notes-input").value;
    saveLessonNotes(classroomSession.classId, notes).catch((err) => {
      alert("Could not save notes: " + err.message);
    });
  });

  classroomEl("lesson-file-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || !classroomSession) return;
    const progressEl = classroomEl("lesson-upload-progress");
    progressEl.textContent = "Uploading… 0%";
    try {
      const fileMeta = await uploadLessonFile(classroomSession.classId, file, (pct) => {
        progressEl.textContent = `Uploading… ${pct}%`;
      });
      await addLessonFile(classroomSession.classId, fileMeta);
      progressEl.textContent = "";
    } catch (err) {
      progressEl.textContent = "";
      alert("Could not upload file: " + err.message);
    }
  });
}

function initClassroom() {
  wireClassroomEvents();
  if (!classroomSession || !FIREBASE_CONFIGURED) return;
  if (classroomSession.role === "student") {
    // Students always resume straight back into their class (anonymous identity).
    ensureAuth()
      .then(() => {
        openStudentDashboard(classroomSession.classId, classroomSession.className, classroomSession.studentUid);
      })
      .catch(() => {
        /* couldn't resume — leave whatever screen app.js's init() already picked */
      });
  } else if (classroomSession.role === "teacher") {
    // Teachers only resume if their Google sign-in is still active (never
    // force anonymous sign-in here — that would silently replace a real
    // teacher session).
    waitForAuthReady().then((user) => {
      if (user && !user.isAnonymous) {
        openTeacherDashboard(classroomSession.classId, classroomSession.className, classroomSession.code);
      }
    });
  }
}

initClassroom();
