(function () {
  var tabs = document.querySelectorAll(".auth-tab");
  var panes = document.querySelectorAll(".auth-pane");
  var loginForm = document.querySelector("#login-form");
  var loginNote = document.querySelector("#login-note");
  var signupForm = document.querySelector("#signup-form");
  var userIdInput = document.querySelector("#signup-user-id");
  var emailInput = document.querySelector("#signup-email");
  var passwordInput = document.querySelector("#signup-password");
  var passwordCheckInput = document.querySelector("#signup-password-check");
  var checkIdBtn = document.querySelector("#check-id-btn");
  var checkEmailBtn = document.querySelector("#check-email-btn");
  var methodButtons = document.querySelectorAll(".signup-method");
  var signupOptions = document.querySelectorAll(".signup-options button");
  var signupNote = document.querySelector("#signup-note");
  var selectedMethod = "email";

  if (tabs.length && panes.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-target");
        tabs.forEach(function (t) {
          t.classList.remove("is-active");
        });
        panes.forEach(function (p) {
          p.classList.remove("is-active");
        });
        tab.classList.add("is-active");
        var pane = document.getElementById(target);
        if (pane) pane.classList.add("is-active");
      });
    });
  }

  if (loginForm && loginNote) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var accountInput = loginForm.querySelector('input[name="account"]');
      var passwordField = loginForm.querySelector('input[name="password"]');
      if (!accountInput || !passwordField) return;
      var result = window.AuthStore.login(accountInput.value, passwordField.value);
      if (!result.ok) {
        loginNote.textContent = result.message;
        return;
      }

      loginNote.textContent = "로그인 성공. 이동합니다.";
      var params = new URLSearchParams(window.location.search);
      var next = params.get("next");
      if (result.user.role === "admin") {
        window.location.href = next || "admin.html";
      } else {
        window.location.href = "index.html";
      }
    });
  }

  if (signupOptions.length && signupNote) {
    signupOptions.forEach(function (btn) {
      btn.addEventListener("click", function () {
        signupNote.textContent = "\"" + btn.textContent.trim() + "\" 선택됨. 다음 단계는 준비 중입니다.";
      });
    });
  }

  if (methodButtons.length) {
    methodButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        methodButtons.forEach(function (node) {
          node.classList.remove("is-active");
        });
        btn.classList.add("is-active");
        selectedMethod = btn.getAttribute("data-method") || "email";
        if (signupNote) signupNote.textContent = "";
      });
    });
  }

  if (checkIdBtn && userIdInput && signupNote) {
    checkIdBtn.addEventListener("click", function () {
      var value = userIdInput.value.trim();
      if (value.length < 4) {
        signupNote.textContent = "계정명은 4자 이상 입력해 주세요.";
        return;
      }
      signupNote.textContent = window.AuthStore.isUserIdTaken(value)
        ? "이미 사용 중인 계정명입니다."
        : "사용 가능한 계정명입니다.";
    });
  }

  if (checkEmailBtn && emailInput && signupNote) {
    checkEmailBtn.addEventListener("click", function () {
      var value = emailInput.value.trim();
      if (!value) {
        signupNote.textContent = "이메일을 입력해 주세요.";
        return;
      }
      signupNote.textContent = window.AuthStore.isEmailTaken(value)
        ? "이미 사용 중인 이메일입니다."
        : "사용 가능한 이메일입니다.";
    });
  }

  if (signupForm && signupNote) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!userIdInput || !emailInput || !passwordInput || !passwordCheckInput) return;

      var password = passwordInput.value;
      if (!window.AuthStore.isValidPassword(password)) {
        signupNote.textContent = "비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.";
        return;
      }
      if (password !== passwordCheckInput.value) {
        signupNote.textContent = "비밀번호가 일치하지 않습니다.";
        return;
      }

      var phoneInput = document.querySelector("#signup-phone");
      var nicknameInput = document.querySelector("#signup-nickname");
      var payload = {
        userId: userIdInput.value,
        email: emailInput.value,
        phone: phoneInput ? phoneInput.value : "",
        nickname: nicknameInput ? nicknameInput.value : userIdInput.value,
        password: password
      };

      if (selectedMethod === "phone" && !payload.phone.trim()) {
        signupNote.textContent = "전화번호 회원가입을 선택한 경우 전화번호를 입력해 주세요.";
        return;
      }

      var result = window.AuthStore.registerUser(payload);
      if (!result.ok) {
        signupNote.textContent = result.message;
        return;
      }

      signupNote.textContent = "회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.";
      signupForm.reset();
      setTimeout(function () {
        window.location.href = "login.html";
      }, 800);
    });
  }
})();
