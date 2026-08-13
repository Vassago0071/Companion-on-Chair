/* Classroom Mode — teacher-hosted sessions with a live class leaderboard and
 * a session-scoped shop. Backed by Firebase (Firestore + Anonymous Auth); see
 * js/firebase-config.js for setup. If Firebase isn't configured yet, the
 * Classroom screen shows a setup notice and the rest of the app is
 * unaffected. */

const CLASSROOM_KEY = "focusCompanion.classroom.v1";

let firebaseApp = null;
let db = null;
let auth = null;
let currentUid = null;
let rosterUnsubscribe = null;
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

function generateClassCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function createClassInFirestore(className) {
  const uid = await ensureAuth();
  const code = generateClassCode();
  const ref = await db.collection("classes").add({
    name: className,
    code,
    teacherUid: uid,
    active: true,
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
  const companion = getCompanion(state.companionId);
  const customization = getCustomization(state.companionId);
  const ref = db.collection("classes").doc(classId).collection("students").doc(uid);
  const existing = await ref.get();
  if (existing.exists) {
    // Rejoining (e.g. page reload) — refresh name/appearance, keep points & purchases.
    await ref.update({ name: displayName, companionId: companion.id, customization });
  } else {
    await ref.set({
      name: displayName,
      companionId: companion.id,
      customization,
      points: 0,
      ownedDecor: [],
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

async function awardPoints(classId, studentUid, delta) {
  await db
    .collection("classes")
    .doc(classId)
    .collection("students")
    .doc(studentUid)
    .update({ points: firebase.firestore.FieldValue.increment(delta) });
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

async function endClassInFirestore(classId) {
  await db.collection("classes").doc(classId).update({ active: false });
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
    const card = document.createElement("div");
    card.className = "roster-card" + (s.uid === highlightUid ? " me" : "");
    card.innerHTML = `
      <div class="roster-rank">#${idx + 1}</div>
      <div class="roster-art">${renderCompanionArt(companion, "idle", s.customization)}</div>
      <div class="roster-name">${escapeHTML(s.name || "Student")}</div>
      <div class="roster-points">${s.points || 0} 🏅</div>
      ${
        isTeacher
          ? `<div class="roster-point-controls">
        <button class="point-btn" data-delta="1">+1</button>
        <button class="point-btn" data-delta="5">+5</button>
        <button class="point-btn subtract" data-delta="-1">-1</button>
      </div>`
          : ""
      }
    `;
    if (isTeacher) {
      card.querySelectorAll(".point-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          awardPoints(classId, s.uid, Number(btn.dataset.delta)).catch((err) => {
            alert("Could not award points: " + err.message);
          });
        });
      });
    }
    wrap.appendChild(card);
  });
}

function openTeacherDashboard(classId, className, code) {
  showOnlyScreen("screen-classroom-teacher");
  classroomEl("teacher-class-name").textContent = className;
  classroomEl("teacher-class-code").textContent = code;
  if (rosterUnsubscribe) rosterUnsubscribe();
  rosterUnsubscribe = listenToRoster(classId, (students) => {
    renderRoster("teacher-roster", students, { isTeacher: true, classId });
  });
}

function openStudentDashboard(classId, className, myUid) {
  showOnlyScreen("screen-classroom-student");
  classroomEl("student-class-name").textContent = className;
  if (rosterUnsubscribe) rosterUnsubscribe();
  rosterUnsubscribe = listenToRoster(classId, (students) => {
    studentRosterCache = students;
    renderRoster("student-roster", students, { highlightUid: myUid });
    const me = students.find((s) => s.uid === myUid);
    classroomEl("student-points").textContent = me ? me.points || 0 : 0;
  });
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

function wireClassroomEvents() {
  el("btn-classroom").addEventListener("click", openClassroomHome);
  classroomEl("classroom-home-back").addEventListener("click", showSelectScreen);

  classroomEl("btn-host-class").addEventListener("click", () => showOnlyScreen("screen-classroom-host"));
  classroomEl("host-back").addEventListener("click", openClassroomHome);
  classroomEl("host-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = classroomEl("host-class-name").value.trim();
    if (!name) return;
    try {
      const { classId, code } = await createClassInFirestore(name);
      saveClassroomSession({ role: "teacher", classId, code, className: name });
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

  classroomEl("teacher-end-class").addEventListener("click", async () => {
    if (!classroomSession) return;
    const ok = confirm("End this class session? Students will no longer be able to earn or spend points here.");
    if (!ok) return;
    try {
      await endClassInFirestore(classroomSession.classId);
    } catch (err) {
      alert("Could not end class: " + err.message);
      return;
    }
    if (rosterUnsubscribe) rosterUnsubscribe();
    saveClassroomSession(null);
    showSelectScreen();
  });

  classroomEl("student-leave-class").addEventListener("click", () => {
    if (rosterUnsubscribe) rosterUnsubscribe();
    saveClassroomSession(null);
    showSelectScreen();
  });

  classroomEl("student-open-shop").addEventListener("click", () => {
    if (!classroomSession) return;
    renderClassShop(classroomSession.classId, classroomSession.studentUid);
    openModal("modal-class-shop");
  });
  classroomEl("class-shop-close").addEventListener("click", () => closeModal("modal-class-shop"));
}

function initClassroom() {
  wireClassroomEvents();
  if (classroomSession && FIREBASE_CONFIGURED) {
    ensureAuth()
      .then(() => {
        if (classroomSession.role === "teacher") {
          openTeacherDashboard(classroomSession.classId, classroomSession.className, classroomSession.code);
        } else if (classroomSession.role === "student") {
          openStudentDashboard(classroomSession.classId, classroomSession.className, classroomSession.studentUid);
        }
      })
      .catch(() => {
        /* couldn't resume — leave whatever screen app.js's init() already picked */
      });
  }
}

initClassroom();
