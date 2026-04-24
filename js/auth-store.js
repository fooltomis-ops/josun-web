(function (global) {
  var USERS_KEY = "sinjoseon-users";
  var SESSION_KEY = "sinjoseon-session-user";

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
    login: login,
    logout: logout,
    getSessionUser: getSessionUser
  };
})(window);
