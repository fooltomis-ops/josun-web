(function () {
  var form = document.querySelector("#signup-form");
  var note = document.querySelector("#signup-note");
  if (!form || !note) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var password = form.querySelector("#password");
    var passwordCheck = form.querySelector("#password-check");

    if (!password || !passwordCheck) return;

    if (password.value !== passwordCheck.value) {
      note.textContent = "비밀번호가 일치하지 않습니다.";
      passwordCheck.focus();
      return;
    }

    note.textContent = "회원가입이 완료되었습니다. (데모 페이지)";
    form.reset();
  });
})();
