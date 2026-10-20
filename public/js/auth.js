import {
  possuiSessao,
  salvarToken
} from "./session.js";

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

document.addEventListener(
  "DOMContentLoaded",
  () => {
    configurarSenhas();

    if (
      document.getElementById(
        "login-form"
      )
    ) {
      configurarLogin();
    }

    if (
      document.getElementById(
        "register-form"
      )
    ) {
      configurarCadastro();
    }

    if (
      document.getElementById(
        "verification-status"
      )
    ) {
      verificarEmail();
    }
  }
);

function configurarSenhas() {
  document
    .querySelectorAll(
      "[data-toggle-password]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const id =
            button.dataset
              .togglePassword;

          const input =
            document.getElementById(
              id
            );

          if (!input) return;

          const mostrar =
            input.type ===
            "password";

          input.type =
            mostrar
              ? "text"
              : "password";

          button.textContent =
            mostrar
              ? "Ocultar"
              : "Mostrar";

          button.setAttribute(
            "aria-label",
            mostrar
              ? "Ocultar senha"
              : "Mostrar senha"
          );
        }
      );
    });
}

function configurarLogin() {
  if (possuiSessao()) {
    window.location.replace(
      "/conta.html"
    );

    return;
  }

  const form =
    document.getElementById(
      "login-form"
    );

  const email =
    document.getElementById(
      "email"
    );

  const password =
    document.getElementById(
      "password"
    );

  const resend =
    document.getElementById(
      "resend-button"
    );

  form.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      limparMensagem();
      limparErros();

      resend.classList.add(
        "hidden"
      );

      const emailValue =
        email.value.trim();

      const passwordValue =
        password.value;

      let valido = true;

      const emailError =
        validarEmail(
          emailValue
        );

      if (emailError) {
        erroCampo(
          "email",
          emailError
        );

        valido = false;
      }

      if (!passwordValue) {
        erroCampo(
          "password",
          "Informe sua senha."
        );

        valido = false;
      }

      if (!valido) return;

      definirCarregando(
        true,
        "Entrando..."
      );

      try {
        const response =
          await fetch(
            "/api/auth/login",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                email:
                  emailValue,

                password:
                  passwordValue
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          tratarErroLogin(
            data.error
          );

          return;
        }

        salvarToken(
          data.token
        );

        window.location.href =
          "/conta.html";
      } catch {
        mostrarMensagem(
          "Não foi possível conectar ao sistema.",
          "error"
        );
      } finally {
        definirCarregando(
          false,
          "Entrar"
        );
      }
    }
  );

  resend.addEventListener(
    "click",
    async () => {
      const emailValue =
        email.value.trim();

      const error =
        validarEmail(
          emailValue
        );

      if (error) {
        erroCampo(
          "email",
          error
        );

        return;
      }

      resend.disabled = true;

      try {
        await fetch(
          "/api/auth/resend-verification",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              email:
                emailValue
            })
          }
        );

        mostrarMensagem(
          "Se o e-mail estiver cadastrado, uma nova verificação foi enviada.",
          "success"
        );
      } catch {
        mostrarMensagem(
          "Não foi possível solicitar uma nova verificação.",
          "error"
        );
      } finally {
        resend.disabled =
          false;
      }
    }
  );
}

function configurarCadastro() {
  const form =
    document.getElementById(
      "register-form"
    );

  const name =
    document.getElementById(
      "name"
    );

  const email =
    document.getElementById(
      "email"
    );

  const password =
    document.getElementById(
      "password"
    );

  const confirmPassword =
    document.getElementById(
      "confirm-password"
    );

  form.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      limparMensagem();
      limparErros();

      const nameValue =
        name.value.trim();

      const emailValue =
        email.value.trim();

      const passwordValue =
        password.value;

      const confirmValue =
        confirmPassword.value;

      let valido = true;

      const nameError =
        validarNome(
          nameValue
        );

      const emailError =
        validarEmail(
          emailValue
        );

      const passwordError =
        validarSenha(
          passwordValue
        );

      if (nameError) {
        erroCampo(
          "name",
          nameError
        );

        valido = false;
      }

      if (emailError) {
        erroCampo(
          "email",
          emailError
        );

        valido = false;
      }

      if (passwordError) {
        erroCampo(
          "password",
          passwordError
        );

        valido = false;
      }

      if (!confirmValue) {
        erroCampo(
          "confirm-password",
          "Confirme sua senha."
        );

        valido = false;
      } else if (
        passwordValue !==
        confirmValue
      ) {
        erroCampo(
          "confirm-password",
          "As senhas não coincidem."
        );

        valido = false;
      }

      if (!valido) return;

      definirCarregando(
        true,
        "Criando conta..."
      );

      try {
        const response =
          await fetch(
            "/api/auth/register",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                name:
                  nameValue,

                email:
                  emailValue,

                password:
                  passwordValue
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          tratarErroCadastro(
            data.error
          );

          return;
        }

        mostrarMensagem(
          "Conta criada. Confirme seu e-mail antes de entrar.",
          "success"
        );

        form.reset();

        setTimeout(
          () => {
            window.location.href =
              `/login.html?email=${encodeURIComponent(
                emailValue
              )}`;
          },
          1500
        );
      } catch {
        mostrarMensagem(
          "Não foi possível realizar o cadastro.",
          "error"
        );
      } finally {
        definirCarregando(
          false,
          "Criar conta"
        );
      }
    }
  );
}

async function verificarEmail() {
  const status =
    document.getElementById(
      "verification-status"
    );

  const loginLink =
    document.getElementById(
      "login-link"
    );

  const params =
    new URLSearchParams(
      window.location.search
    );

  const token =
    params.get("token");

  if (!token) {
    status.innerHTML = `
      <div class="status-icon error">
        !
      </div>

      <h2>Link inválido</h2>

      <p>
        O token de verificação não foi informado.
      </p>
    `;

    loginLink.classList.remove(
      "hidden"
    );

    return;
  }

  try {
    const response =
      await fetch(
        `/api/auth/verify-email?token=${encodeURIComponent(
          token
        )}`
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error
      );
    }

    status.innerHTML = `
      <div class="status-icon success">
        ✓
      </div>

      <h2>E-mail confirmado</h2>

      <p>
        Sua conta está ativa e já pode ser utilizada.
      </p>
    `;

    loginLink.classList.remove(
      "hidden"
    );
  } catch (error) {
    status.innerHTML = `
      <div class="status-icon error">
        !
      </div>

      <h2>Não foi possível confirmar</h2>

      <p>
        ${mensagemToken(
          error.message
        )}
      </p>
    `;

    loginLink.classList.remove(
      "hidden"
    );
  }
}

function validarNome(value) {
  if (!value) {
    return "Informe seu nome.";
  }

  if (value.length < 2) {
    return (
      "O nome deve possuir " +
      "pelo menos 2 caracteres."
    );
  }

  if (
    !/[A-Za-zÀ-ÿ]/.test(
      value
    )
  ) {
    return "Informe um nome válido.";
  }

  return null;
}

function validarEmail(value) {
  if (!value) {
    return "Informe seu e-mail.";
  }

  if (
    !emailRegex.test(value)
  ) {
    return (
      "Informe um endereço " +
      "de e-mail válido."
    );
  }

  return null;
}

function validarSenha(value) {
  if (!value) {
    return "Informe sua senha.";
  }

  if (value.length < 8) {
    return (
      "A senha deve possuir " +
      "no mínimo 8 caracteres."
    );
  }

  if (!/[a-z]/.test(value)) {
    return (
      "Inclua pelo menos uma " +
      "letra minúscula."
    );
  }

  if (!/[A-Z]/.test(value)) {
    return (
      "Inclua pelo menos uma " +
      "letra maiúscula."
    );
  }

  if (!/\d/.test(value)) {
    return (
      "Inclua pelo menos um número."
    );
  }

  return null;
}

function erroCampo(
  id,
  mensagem
) {
  const input =
    document.getElementById(
      id
    );

  const error =
    document.getElementById(
      `${id}-error`
    );

  if (input) {
    input.setAttribute(
      "aria-invalid",
      "true"
    );
  }

  if (error) {
    error.textContent =
      mensagem;
  }
}

function limparErros() {
  document
    .querySelectorAll(
      ".field-error"
    )
    .forEach(element => {
      element.textContent = "";
    });

  document
    .querySelectorAll(
      "input"
    )
    .forEach(input => {
      input.removeAttribute(
        "aria-invalid"
      );
    });
}

function mostrarMensagem(
  texto,
  type = "info"
) {
  const message =
    document.getElementById(
      "message"
    );

  if (!message) return;

  message.textContent =
    texto;

  message.className =
    `message ${type}`;
}

function limparMensagem() {
  const message =
    document.getElementById(
      "message"
    );

  if (!message) return;

  message.textContent = "";

  message.className =
    "message hidden";
}

function definirCarregando(
  carregando,
  texto
) {
  const button =
    document.getElementById(
      "submit-button"
    );

  if (!button) return;

  button.disabled =
    carregando;

  button.textContent =
    texto;
}

function tratarErroLogin(code) {
  if (
    code ===
    "EMAIL_NOT_VERIFIED"
  ) {
    mostrarMensagem(
      "Confirme seu e-mail antes de entrar.",
      "error"
    );

    document
      .getElementById(
        "resend-button"
      )
      ?.classList
      .remove("hidden");

    return;
  }

  if (
    code ===
    "INVALID_CREDENTIALS"
  ) {
    mostrarMensagem(
      "E-mail ou senha incorretos.",
      "error"
    );

    return;
  }

  if (
    code ===
    "USER_BLOCKED"
  ) {
    mostrarMensagem(
      "Esta conta está bloqueada.",
      "error"
    );

    return;
  }

  mostrarMensagem(
    "Não foi possível realizar o login.",
    "error"
  );
}

function tratarErroCadastro(code) {
  if (
    code ===
    "EMAIL_IN_USE"
  ) {
    erroCampo(
      "email",
      "Este e-mail já está cadastrado."
    );

    return;
  }

  if (
    code ===
    "INVALID_NAME"
  ) {
    erroCampo(
      "name",
      "Informe um nome válido."
    );

    return;
  }

  if (
    code ===
    "INVALID_EMAIL"
  ) {
    erroCampo(
      "email",
      "Informe um e-mail válido."
    );

    return;
  }

  if (
    code ===
    "WEAK_PASSWORD"
  ) {
    erroCampo(
      "password",
      "A senha não atende aos requisitos de segurança."
    );

    return;
  }

  mostrarMensagem(
    "Não foi possível realizar o cadastro.",
    "error"
  );
}

function mensagemToken(code) {
  if (
    code ===
    "TOKEN_EXPIRED"
  ) {
    return (
      "O link de verificação expirou. " +
      "Solicite um novo envio."
    );
  }

  if (
    code ===
    "TOKEN_ALREADY_USED"
  ) {
    return (
      "Este link já foi utilizado. " +
      "Tente entrar normalmente."
    );
  }

  return (
    "O link de verificação " +
    "é inválido ou não está mais disponível."
  );
}