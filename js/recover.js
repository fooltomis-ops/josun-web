(function () {
  if (!window.AuthStore) return;

  var findForm = document.querySelector("#find-account-form");
  var resetForm = document.querySelector("#reset-password-form");
  var note = document.querySelector("#recover-note");

  if (findForm && note) {
    findForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = findForm.querySelector("#find-email");
      if (!email) return;
      var result = window.AuthStore.findAccountByEmail(email.value);
      note.textContent = result.ok ? "가입 계정명: " + result.userId : result.message;
    });
  }

  if (resetForm && note) {
    resetForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var userId = resetForm.querySelector("#reset-user-id");
      var email = resetForm.querySelector("#reset-email");
      var pw = resetForm.querySelector("#reset-password");
      var pwCheck = resetForm.querySelector("#reset-password-check");
      if (!userId || !email || !pw || !pwCheck) return;

      if (pw.value !== pwCheck.value) {
        note.textContent = "새 비밀번호가 일치하지 않습니다.";
        return;
      }

      var result = window.AuthStore.resetPassword({
        userId: userId.value,
        email: email.value,
        newPassword: pw.value
      });
      if (!result.ok) {
        note.textContent = result.message;
        return;
      }

      note.textContent = "비밀번호가 재설정되었습니다. 로그인 페이지로 이동합니다.";
      resetForm.reset();
      setTimeout(function () {
        window.location.href = "login.html";
      }, 900);
    });
  }
})();
