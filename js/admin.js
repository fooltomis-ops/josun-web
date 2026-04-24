(function () {
  var form = document.querySelector(".notice-form");
  var note = document.querySelector(".form-note");
  var logoutBtn = document.querySelector(".logout-btn");
  var adminUserLabel = document.querySelector("#admin-user-label");
  var newUsersCount = document.querySelector("#new-users-count");
  var todayVisitsCount = document.querySelector("#today-visits-count");
  var pendingInquiryCount = document.querySelector("#pending-inquiry-count");
  var openReportCount = document.querySelector("#open-report-count");
  var boardTbody = document.querySelector("#admin-board-tbody");
  var userTbody = document.querySelector("#admin-user-tbody");
  var visitLogTbody = document.querySelector("#admin-visit-log-tbody");
  var preregTbody = document.querySelector("#admin-prereg-tbody");
  var NOTICE_KEY = "sinjoseon-notice-board";
  var FREE_KEY = "sinjoseon-free-board";

  if (!window.AuthStore) return;

  var sessionUser = window.AuthStore.getSessionUser();
  if (!sessionUser || sessionUser.role !== "admin") {
    window.location.href = "login.html?next=admin.html";
    return;
  }

  if (adminUserLabel) {
    adminUserLabel.textContent = sessionUser.nickname + "(" + sessionUser.userId + ")";
  }

  function refreshStats() {
    if (todayVisitsCount) {
      todayVisitsCount.textContent = String(window.AuthStore.getTodayVisits());
    }
    if (newUsersCount) {
      newUsersCount.textContent = String(window.AuthStore.getTodaySignups());
    }
    if (pendingInquiryCount) {
      pendingInquiryCount.textContent = String(window.AuthStore.getPendingInquiryCount());
    }
    if (openReportCount) {
      openReportCount.textContent = String(window.AuthStore.getOpenReportCount());
    }
  }

  function getItems(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  function writeItems(key, items) {
    localStorage.setItem(key, JSON.stringify(items));
  }

  function renderBoardTable() {
    if (!boardTbody) return;
    var notices = getItems(NOTICE_KEY).slice(0, 5).map(function (item) {
      return { board: "공지사항", title: item.title, author: item.author, status: "게시중" };
    });
    var frees = getItems(FREE_KEY).slice(0, 5).map(function (item) {
      return { board: "자유게시판", title: item.title, author: item.author, status: "검토중" };
    });
    var rows = notices.concat(frees);

    boardTbody.innerHTML = "";
    if (!rows.length) {
      var emptyRow = document.createElement("tr");
      emptyRow.innerHTML = "<td colspan='5'>표시할 게시글이 없습니다.</td>";
      boardTbody.appendChild(emptyRow);
      return;
    }

    rows.forEach(function (row, index) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + row.board + "</td>" +
        "<td>" + row.title + "</td>" +
        "<td>" + row.author + "</td>" +
        "<td><span class='badge " + (row.board === "공지사항" ? "ok" : "warn") + "'>" + row.status + "</span></td>" +
        "<td><button type='button' class='small-btn' data-index='" + index + "'>삭제</button></td>";
      boardTbody.appendChild(tr);
    });
  }

  function renderUserTable() {
    if (!userTbody) return;
    var users = window.AuthStore.getUsers();
    userTbody.innerHTML = "";
    users.forEach(function (user) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + user.userId + "</td>" +
        "<td>" + user.nickname + "</td>" +
        "<td>" + user.email + "</td>" +
        "<td><span class='badge " + (user.role === "admin" ? "ok" : "warn") + "'>" + user.role + "</span></td>" +
        "<td>" +
        (user.role === "admin"
          ? "<button type='button' class='small-btn' disabled>보호됨</button>"
          : "<button type='button' class='small-btn user-delete-btn' data-user-id='" + user.userId + "'>회원삭제</button>") +
        "</td>";
      userTbody.appendChild(tr);
    });
  }

  function formatDateTime(iso) {
    var dt = new Date(iso);
    if (isNaN(dt.getTime())) return "-";
    return dt.getFullYear() + "-" +
      String(dt.getMonth() + 1).padStart(2, "0") + "-" +
      String(dt.getDate()).padStart(2, "0") + " " +
      String(dt.getHours()).padStart(2, "0") + ":" +
      String(dt.getMinutes()).padStart(2, "0") + ":" +
      String(dt.getSeconds()).padStart(2, "0");
  }

  function renderVisitLogs() {
    if (!visitLogTbody) return;
    var logs = window.AuthStore.getVisitLogs().slice(0, 100);
    visitLogTbody.innerHTML = "";
    if (!logs.length) {
      var empty = document.createElement("tr");
      empty.innerHTML = "<td colspan='2'>접속 로그가 없습니다.</td>";
      visitLogTbody.appendChild(empty);
      return;
    }
    logs.forEach(function (log) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + formatDateTime(log.timestamp) + "</td>" +
        "<td>" + (log.ip || "확인불가") + "</td>";
      visitLogTbody.appendChild(tr);
    });
  }

  function renderPreregTable() {
    if (!preregTbody) return;
    var list = window.AuthStore.getPreregistrations();
    preregTbody.innerHTML = "";
    if (!list.length) {
      var empty = document.createElement("tr");
      empty.innerHTML = "<td colspan='5'>접수된 지원자가 없습니다.</td>";
      preregTbody.appendChild(empty);
      return;
    }
    list.forEach(function (item) {
      var createdText = "-";
      if (item.createdAt) {
        var dt = new Date(item.createdAt);
        if (!isNaN(dt.getTime())) {
          createdText = dt.getFullYear() + "-" +
            String(dt.getMonth() + 1).padStart(2, "0") + "-" +
            String(dt.getDate()).padStart(2, "0") + " " +
            String(dt.getHours()).padStart(2, "0") + ":" +
            String(dt.getMinutes()).padStart(2, "0") + ":" +
            String(dt.getSeconds()).padStart(2, "0");
        }
      }
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + item.name + "</td>" +
        "<td>" + item.email + "</td>" +
        "<td>" + item.phone + "</td>" +
        "<td>" + createdText + "</td>" +
        "<td><button type='button' class='small-btn prereg-delete-btn' data-id='" + item.id + "'>삭제</button></td>";
      preregTbody.appendChild(tr);
    });
  }

  if (boardTbody) {
    boardTbody.addEventListener("click", function (e) {
      var target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.classList.contains("small-btn")) return;
      var row = target.closest("tr");
      if (row && row.children[0] && row.children[1]) {
        var boardName = row.children[0].textContent;
        var title = row.children[1].textContent;
        var key = boardName === "공지사항" ? NOTICE_KEY : FREE_KEY;
        var items = getItems(key).filter(function (item) {
          return item.title !== title;
        });
        writeItems(key, items);
        renderBoardTable();
      }
    });
  }

  if (userTbody) {
    userTbody.addEventListener("click", function (e) {
      var target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.classList.contains("user-delete-btn")) return;
      var userId = target.getAttribute("data-user-id");
      if (!userId) return;
      var ok = confirm("정말 " + userId + " 계정을 삭제하시겠습니까?");
      if (!ok) return;
      var result = window.AuthStore.deleteUser(userId);
      if (!result.ok) {
        alert(result.message);
        return;
      }
      renderUserTable();
      refreshStats();
    });
  }

  if (preregTbody) {
    preregTbody.addEventListener("click", function (e) {
      var target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.classList.contains("prereg-delete-btn")) return;
      var id = target.getAttribute("data-id");
      if (!id) return;
      window.AuthStore.deletePreregistration(id);
      renderPreregTable();
    });
  }

  if (!form || !note) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var titleInput = form.querySelector("#notice-title");
    var typeInput = form.querySelector("#notice-type");
    var bodyInput = form.querySelector("#notice-body");
    if (!titleInput || !typeInput || !bodyInput) return;
    var items = getItems(NOTICE_KEY);
    items.unshift({
      author: sessionUser.nickname,
      title: "[" + typeInput.value + "] " + titleInput.value.trim(),
      body: bodyInput.value.trim(),
      createdAt: new Date().toISOString()
    });
    writeItems(NOTICE_KEY, items.slice(0, 50));
    note.textContent = "공지사항이 등록되었습니다.";
    form.reset();
    renderBoardTable();
    refreshStats();
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      window.AuthStore.logout();
      window.location.href = "login.html";
    });
  }

  renderBoardTable();
  renderUserTable();
  renderVisitLogs();
  renderPreregTable();
  refreshStats();

  window.addEventListener("storage", function () {
    renderBoardTable();
    renderUserTable();
    renderVisitLogs();
    renderPreregTable();
    refreshStats();
  });
})();
