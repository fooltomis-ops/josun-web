(function () {
  if (!window.AuthStore) return;

  var form = document.querySelector("#prereg-form");
  var note = document.querySelector("#prereg-note");
  if (!form || !note) return;

  var emailDomainSelect = form.querySelector("#prereg-email-domain");
  var emailDomainDirect = form.querySelector("#prereg-email-domain-direct");

  if (emailDomainSelect && emailDomainDirect) {
    emailDomainSelect.addEventListener("change", function () {
      var isDirect = emailDomainSelect.value === "direct";
      emailDomainDirect.style.display = isDirect ? "block" : "none";
      emailDomainDirect.required = isDirect;
      if (!isDirect) emailDomainDirect.value = "";
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var nameInput = form.querySelector("#prereg-name");
    var emailIdInput = form.querySelector("#prereg-email-id");
    var emailDomainInput = form.querySelector("#prereg-email-domain");
    var emailDomainDirectInput = form.querySelector("#prereg-email-domain-direct");
    var phoneInput = form.querySelector("#prereg-phone");
    if (!nameInput || !emailIdInput || !emailDomainInput || !phoneInput) return;

    var emailId = emailIdInput.value.trim();
    var domain = emailDomainInput.value === "direct"
      ? (emailDomainDirectInput ? emailDomainDirectInput.value.trim() : "")
      : emailDomainInput.value;

    if (!emailId || !domain) {
      note.textContent = "이메일 아이디와 도메인을 입력해 주세요.";
      return;
    }

    var email = emailId + "@" + domain;

    var result = window.AuthStore.addPreregistration({
      name: nameInput.value,
      email: email,
      phone: phoneInput.value
    });

    if (!result.ok) {
      note.textContent = result.message;
      return;
    }

    note.textContent = "";
    alert("사전이벤트 접수가 완료되었습니다.");
    form.reset();
    window.location.href = "index.html";
  });
})();
