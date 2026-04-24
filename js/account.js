(function () {
  if (!window.AuthStore) return;

  var sessionUser = window.AuthStore.getSessionUser();
  if (!sessionUser) {
    window.location.href = "login.html?next=account.html";
    return;
  }

  var accountUser = document.querySelector("#account-user");
  var changeForm = document.querySelector("#change-password-form");
  var deleteForm = document.querySelector("#delete-account-form");
  var note = document.querySelector("#account-note");

  if (accountUser) {
    accountUser.textContent = sessionUser.nickname + " (" + sessionUser.userId + ")";
  }

  if (changeForm && note) {
    changeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var current = changeForm.querySelector("#current-password");
      var next = changeForm.querySelector("#next-password");
      var nextCheck = changeForm.querySelector("#next-password-check");
      if (!current || !next || !nextCheck) return;

      if (next.value !== nextCheck.value) {
        note.textContent = "새 비밀번호 확인 값이 일치하지 않습니다.";
        return;
      }
      var result = window.AuthStore.changePassword(sessionUser.userId, current.value, next.value);
      note.textContent = result.ok ? "비밀번호가 변경되었습니다." : result.message;
      if (result.ok) changeForm.reset();
    });
  }

  if (deleteForm && note) {
    deleteForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var confirmInput = deleteForm.querySelector("#delete-confirm");
      if (!confirmInput) return;
      if (confirmInput.value.trim() !== "탈퇴") {
        note.textContent = "탈퇴 확인 문구가 일치하지 않습니다.";
        return;
      }
      var result = window.AuthStore.deleteUser(sessionUser.userId);
      if (!result.ok) {
        note.textContent = result.message;
        return;
      }
      note.textContent = "회원 탈퇴가 완료되었습니다.";
      setTimeout(function () {
        window.location.href = "index.html";
      }, 800);
    });
  }
})();
