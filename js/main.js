(function () {
  var header = document.querySelector(".site-header");
  var nav = document.querySelector(".site-nav");
  var toggle = document.querySelector(".nav-toggle");
  var quickAuth = document.querySelector(".quick-auth");
  var noticeForm = document.querySelector("#notice-form");
  var noticeList = document.querySelector("#notice-list");
  var noticeEmpty = document.querySelector("#notice-empty");
  var noticeClearBtn = document.querySelector("#notice-clear-btn");
  var freeForm = document.querySelector("#free-form");
  var freeList = document.querySelector("#free-list");
  var freeEmpty = document.querySelector("#free-empty");
  var freeClearBtn = document.querySelector("#free-clear-btn");
  var freeAuthNote = document.querySelector("#free-auth-note");
  var NOTICE_KEY = "sinjoseon-notice-board";
  var FREE_KEY = "sinjoseon-free-board";
  var sessionUser = window.AuthStore ? window.AuthStore.getSessionUser() : null;

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  if (quickAuth && window.AuthStore) {
    quickAuth.addEventListener("submit", function (e) {
      e.preventDefault();
      var idInput = quickAuth.querySelector('input[name="userId"]');
      var pwInput = quickAuth.querySelector('input[name="password"]');
      if (!idInput || !pwInput) return;
      var result = window.AuthStore.login(idInput.value, pwInput.value);
      if (!result.ok) {
        alert(result.message);
        return;
      }
      if (result.user.role === "admin") {
        window.location.href = "admin.html";
      } else {
        alert(result.user.nickname + "님, 로그인되었습니다.");
        quickAuth.reset();
      }
    });
  }

  function getItems(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  function saveItems(key, items) {
    localStorage.setItem(key, JSON.stringify(items));
  }

  function createListItem(item, type) {
    var li = document.createElement("li");
    var tag = document.createElement("span");
    tag.textContent = type === "notice" ? "[공지]" : "[자유]";
    var title = document.createElement("a");
    title.href = "#";
    title.textContent = item.title;
    var author = document.createElement("em");
    author.textContent = item.author;
    li.appendChild(tag);
    li.appendChild(title);
    li.appendChild(author);
    return li;
  }

  function renderBoard(key, listEl, emptyEl, type) {
    if (!listEl || !emptyEl) return;
    var items = getItems(key);
    listEl.innerHTML = "";
    items.forEach(function (item) {
      listEl.appendChild(createListItem(item, type));
    });
    emptyEl.style.display = items.length ? "none" : "block";
  }

  function bindBoard(formEl, key, listEl, emptyEl, type) {
    if (!formEl) return;
    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      var authorInput = formEl.querySelector('input[name="author"]');
      var titleInput = formEl.querySelector('input[name="title"]');
      var author = authorInput && authorInput.value.trim();
      var title = titleInput && titleInput.value.trim();
      if (!author || !title) return;
      var items = getItems(key);
      items.unshift({ author: author, title: title });
      saveItems(key, items.slice(0, 30));
      renderBoard(key, listEl, emptyEl, type);
      formEl.reset();
    });
  }

  bindBoard(noticeForm, NOTICE_KEY, noticeList, noticeEmpty, "notice");
  bindBoard(freeForm, FREE_KEY, freeList, freeEmpty, "free");
  renderBoard(NOTICE_KEY, noticeList, noticeEmpty, "notice");
  renderBoard(FREE_KEY, freeList, freeEmpty, "free");

  if (freeForm) {
    var authorInput = freeForm.querySelector('input[name="author"]');
    var titleInput = freeForm.querySelector('input[name="title"]');
    var submitButton = freeForm.querySelector('button[type="submit"]');
    if (!sessionUser) {
      if (authorInput) authorInput.value = "";
      if (authorInput) authorInput.disabled = true;
      if (titleInput) titleInput.disabled = true;
      if (submitButton) submitButton.disabled = true;
      if (freeAuthNote) {
        freeAuthNote.innerHTML = "자유게시판은 로그인 후 작성할 수 있습니다. <a href=\"login.html\">로그인하기</a>";
      }
    } else {
      if (authorInput) {
        authorInput.value = sessionUser.nickname;
        authorInput.readOnly = true;
      }
      if (freeAuthNote) {
        freeAuthNote.textContent = sessionUser.nickname + " 님으로 작성됩니다.";
      }
    }
  }

  if (freeClearBtn) {
    freeClearBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (!sessionUser) {
        alert("로그인 후 이용해 주세요.");
        return;
      }
      localStorage.removeItem(FREE_KEY);
      renderBoard(FREE_KEY, freeList, freeEmpty, "free");
    });
  }
})();
