(function (global) {
  var USERS_KEY = "sinjoseon-users";
  var SESSION_KEY = "sinjoseon-session-user";
  var DAILY_VISITS_KEY = "sinjoseon-daily-visits";
  var INQUIRIES_KEY = "sinjoseon-inquiries";
  var REPORTS_KEY = "sinjoseon-reports";
  var PREREG_KEY = "sinjoseon-preregistrations";

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getTodayKey() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, "0");
    var d = String(now.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function seedAdminUser() {
    var users = read(USERS_KEY, []);
    var hasAdmin = users.some(function (u) {
      return u.userId === "admin";
    });
    if (!hasAdmin) {
      users.push({
        userId: "admin",
        email: "admin@sinjoseon.local",
        nickname: "운영자",
        phone: "",
        password: "admin1234!",
        role: "admin",
        createdAt: new Date().toISOString()
      });
      write(USERS_KEY, users);
    }
  }

  function getUsers() {
    return read(USERS_KEY, []);
  }

  function saveUsers(users) {
    write(USERS_KEY, users);
  }

  function isValidPassword(password) {
    var hasLength = password.length >= 8;
    var hasLetter = /[A-Za-z]/.test(password);
    var hasNumber = /[0-9]/.test(password);
    var hasSpecial = /[^A-Za-z0-9]/.test(password);
    return hasLength && hasLetter && hasNumber && hasSpecial;
  }

  function isUserIdTaken(userId) {
    var users = getUsers();
    return users.some(function (u) {
      return u.userId.toLowerCase() === String(userId).toLowerCase();
    });
  }

  function isEmailTaken(email) {
    var users = getUsers();
    return users.some(function (u) {
      return u.email.toLowerCase() === String(email).toLowerCase();
    });
  }

  function registerUser(payload) {
    var userId = payload.userId.trim();
    var email = payload.email.trim().toLowerCase();
    var nickname = payload.nickname.trim();
    var phone = (payload.phone || "").trim();
    var password = payload.password;

    if (isUserIdTaken(userId)) {
      return { ok: false, message: "이미 사용 중인 계정명입니다." };
    }
    if (isEmailTaken(email)) {
      return { ok: false, message: "이미 사용 중인 이메일입니다." };
    }
    if (!isValidPassword(password)) {
      return { ok: false, message: "비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다." };
    }

    var users = getUsers();
    users.push({
      userId: userId,
      email: email,
      nickname: nickname,
      phone: phone,
      password: password,
      role: "user",
      createdAt: new Date().toISOString()
    });
    saveUsers(users);
    return { ok: true };
  }

  function findAccountByEmail(email) {
    var query = String(email).trim().toLowerCase();
    var user = getUsers().find(function (u) {
      return u.email.toLowerCase() === query;
    });
    if (!user) return { ok: false, message: "일치하는 이메일 계정을 찾을 수 없습니다." };
    return { ok: true, userId: user.userId };
  }

  function resetPassword(payload) {
    var userId = String(payload.userId || "").trim().toLowerCase();
    var email = String(payload.email || "").trim().toLowerCase();
    var newPassword = String(payload.newPassword || "");
    if (!isValidPassword(newPassword)) {
      return { ok: false, message: "새 비밀번호 규칙을 확인해 주세요." };
    }
    var users = getUsers();
    var idx = users.findIndex(function (u) {
      return u.userId.toLowerCase() === userId && u.email.toLowerCase() === email;
    });
    if (idx < 0) {
      return { ok: false, message: "입력한 계정 정보가 일치하지 않습니다." };
    }
    users[idx].password = newPassword;
    saveUsers(users);
    return { ok: true };
  }

  function changePassword(userId, currentPassword, nextPassword) {
    if (!isValidPassword(nextPassword)) {
      return { ok: false, message: "새 비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다." };
    }
    var users = getUsers();
    var idx = users.findIndex(function (u) {
      return u.userId === userId;
    });
    if (idx < 0) return { ok: false, message: "사용자를 찾을 수 없습니다." };
    if (users[idx].password !== currentPassword) {
      return { ok: false, message: "현재 비밀번호가 올바르지 않습니다." };
    }
    users[idx].password = nextPassword;
    saveUsers(users);
    return { ok: true };
  }

  function deleteUser(userId) {
    if (userId === "admin") {
      return { ok: false, message: "기본 관리자 계정은 삭제할 수 없습니다." };
    }
    var users = getUsers();
    var filtered = users.filter(function (u) {
      return u.userId !== userId;
    });
    if (filtered.length === users.length) {
      return { ok: false, message: "삭제할 사용자가 없습니다." };
    }
    saveUsers(filtered);
    var session = getSessionUser();
    if (session && session.userId === userId) {
      logout();
    }
    return { ok: true };
  }

  function trackVisit() {
    var todayKey = getTodayKey();
    var sessionVisitKey = "sinjoseon-visit-marked-" + todayKey;
    try {
      if (sessionStorage.getItem(sessionVisitKey)) return;
      sessionStorage.setItem(sessionVisitKey, "1");
    } catch (err) {
      // ignore session storage errors
    }
    var map = read(DAILY_VISITS_KEY, {});
    map[todayKey] = (map[todayKey] || 0) + 1;
    write(DAILY_VISITS_KEY, map);
  }

  function getTodayVisits() {
    var map = read(DAILY_VISITS_KEY, {});
    return map[getTodayKey()] || 0;
  }

  function getTodaySignups() {
    var today = getTodayKey();
    return getUsers().filter(function (u) {
      if (u.role === "admin" || !u.createdAt) return false;
      return String(u.createdAt).slice(0, 10) === today;
    }).length;
  }

  function addInquiry(item) {
    var arr = read(INQUIRIES_KEY, []);
    arr.unshift({
      id: Date.now(),
      status: "pending",
      createdAt: new Date().toISOString(),
      title: item.title || "",
      author: item.author || ""
    });
    write(INQUIRIES_KEY, arr.slice(0, 200));
  }

  function addReport(item) {
    var arr = read(REPORTS_KEY, []);
    arr.unshift({
      id: Date.now(),
      status: "open",
      createdAt: new Date().toISOString(),
      title: item.title || "",
      author: item.author || ""
    });
    write(REPORTS_KEY, arr.slice(0, 200));
  }

  function getPendingInquiryCount() {
    return read(INQUIRIES_KEY, []).filter(function (x) {
      return x.status === "pending";
    }).length;
  }

  function getOpenReportCount() {
    return read(REPORTS_KEY, []).filter(function (x) {
      return x.status === "open";
    }).length;
  }

  function addPreregistration(payload) {
    var name = String(payload.name || "").trim();
    var email = String(payload.email || "").trim().toLowerCase();
    var phone = String(payload.phone || "").trim();
    if (!name || !email || !phone) {
      return { ok: false, message: "이름, 이메일, 연락처를 모두 입력해 주세요." };
    }
    var list = read(PREREG_KEY, []);
    var exists = list.some(function (x) {
      return x.email === email;
    });
    if (exists) {
      return { ok: false, message: "이미 접수된 이메일입니다." };
    }
    list.unshift({
      id: Date.now(),
      name: name,
      email: email,
      phone: phone,
      createdAt: new Date().toISOString()
    });
    write(PREREG_KEY, list.slice(0, 500));
    return { ok: true };
  }

  function getPreregistrations() {
    return read(PREREG_KEY, []);
  }

  function deletePreregistration(id) {
    var list = read(PREREG_KEY, []);
    var next = list.filter(function (x) {
      return String(x.id) !== String(id);
    });
    write(PREREG_KEY, next);
  }

  function login(account, password) {
    var query = String(account).trim().toLowerCase();
    var users = getUsers();
    var user = users.find(function (u) {
      return u.userId.toLowerCase() === query || u.email.toLowerCase() === query;
    });
    if (!user || user.password !== password) {
      return { ok: false, message: "계정명/이메일 또는 비밀번호가 올바르지 않습니다." };
    }
    var sessionUser = {
      userId: user.userId,
      nickname: user.nickname,
      email: user.email,
      role: user.role
    };
    write(SESSION_KEY, sessionUser);
    return { ok: true, user: sessionUser };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getSessionUser() {
    return read(SESSION_KEY, null);
  }

  seedAdminUser();
  trackVisit();

  global.AuthStore = {
    getUsers: getUsers,
    isValidPassword: isValidPassword,
    isUserIdTaken: isUserIdTaken,
    isEmailTaken: isEmailTaken,
    registerUser: registerUser,
    findAccountByEmail: findAccountByEmail,
    resetPassword: resetPassword,
    changePassword: changePassword,
    deleteUser: deleteUser,
    trackVisit: trackVisit,
    getTodayVisits: getTodayVisits,
    getTodaySignups: getTodaySignups,
    addInquiry: addInquiry,
    addReport: addReport,
    getPendingInquiryCount: getPendingInquiryCount,
    getOpenReportCount: getOpenReportCount,
    addPreregistration: addPreregistration,
    getPreregistrations: getPreregistrations,
    deletePreregistration: deletePreregistration,
    login: login,
    logout: logout,
    getSessionUser: getSessionUser
  };
})(window);
