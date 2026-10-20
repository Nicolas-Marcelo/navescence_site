import {
  createHash,
  randomBytes,
} from "node:crypto";

import bcrypt from "bcryptjs";
import jwt, {
  type SignOptions,
} from "jsonwebtoken";

import { config } from "../config/env.js";
import { prisma } from "../database/prisma.js";

import {
  sendVerificationEmail,
} from "./emailService.js";

type RegisterData = {
  name: string;
  email: string;
  password: string;
};

type LoginData = {
  email: string;
  password: string;
};

type PublicUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerifiedAt: Date | null;
};

function normalizeEmail(
  email: string,
): string {
  return email
    .trim()
    .toLowerCase();
}

function validateName(
  name: string,
): void {
  if (
    !name ||
    name.trim().length < 2
  ) {
    throw new Error(
      "INVALID_NAME",
    );
  }
}

function validateEmail(
  email: string,
): void {
  const regex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!regex.test(email)) {
    throw new Error(
      "INVALID_EMAIL",
    );
  }
}

function validatePassword(
  password: string,
): void {
  const valid =
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password);

  if (!valid) {
    throw new Error(
      "WEAK_PASSWORD",
    );
  }
}

function tokenHash(
  token: string,
): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function verificationExpiration():
  Date {
  return new Date(
    Date.now() +
      config.auth
        .verificationMinutes *
        60 *
        1000,
  );
}

function publicUser(
  user: {
    id: number;
    name: string;
    email: string;
    role: unknown;
    status: unknown;
    emailVerifiedAt: Date | null;
  },
): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: String(user.role),
    status: String(user.status),
    emailVerifiedAt:
      user.emailVerifiedAt,
  };
}

async function
createVerificationToken(
  userId: number,
): Promise<string> {
  const token =
    randomBytes(32)
      .toString("hex");

  const hash =
    tokenHash(token);

  await prisma
    .emailVerificationToken
    .updateMany({
      where: {
        userId,
        usedAt: null,
      },

      data: {
        usedAt: new Date(),
      },
    });

  await prisma
    .emailVerificationToken
    .create({
      data: {
        userId,
        tokenHash: hash,
        expiresAt:
          verificationExpiration(),
      },
    });

  return token;
}

async function
sendUserVerification(
  user: {
    id: number;
    name: string;
    email: string;
  },
): Promise<void> {
  const token =
    await createVerificationToken(
      user.id,
    );

  await sendVerificationEmail({
    to: user.email,
    name: user.name,
    token,
  });
}

export async function register(
  data: RegisterData,
): Promise<PublicUser> {
  const name =
    data.name?.trim() ?? "";

  const email =
    normalizeEmail(
      data.email ?? "",
    );

  const password =
    data.password ?? "";

  validateName(name);
  validateEmail(email);
  validatePassword(password);

  const existing =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });

  if (existing) {
    throw new Error(
      "EMAIL_IN_USE",
    );
  }

  const passwordHash =
    await bcrypt.hash(
      password,
      12,
    );

  const user =
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        status:
          "PENDING_EMAIL",
      },
    });

  try {
    await sendUserVerification(
      user,
    );
  } catch (error) {
    console.error(
      "[EMAIL] Falha ao enviar verificação:",
      error,
    );

    /*
     * A conta permanece criada.
     * O usuário poderá solicitar
     * um novo envio posteriormente.
     */
  }

  return publicUser(user);
}

export async function
verifyEmail(
  token: string,
): Promise<PublicUser> {
  if (
    !token ||
    token.trim().length === 0
  ) {
    throw new Error(
      "INVALID_TOKEN",
    );
  }

  const hash =
    tokenHash(token.trim());

  const verification =
    await prisma
      .emailVerificationToken
      .findUnique({
        where: {
          tokenHash: hash,
        },

        include: {
          user: true,
        },
      });

  if (!verification) {
    throw new Error(
      "INVALID_TOKEN",
    );
  }

  if (verification.usedAt) {
    throw new Error(
      "TOKEN_ALREADY_USED",
    );
  }

  if (
    verification.expiresAt <
    new Date()
  ) {
    throw new Error(
      "TOKEN_EXPIRED",
    );
  }

  const [, user] =
    await prisma.$transaction([
      prisma
        .emailVerificationToken
        .update({
          where: {
            id: verification.id,
          },

          data: {
            usedAt: new Date(),
          },
        }),

      prisma.user.update({
        where: {
          id:
            verification.userId,
        },

        data: {
          status: "ACTIVE",
          emailVerifiedAt:
            new Date(),
        },
      }),
    ]);

  return publicUser(user);
}

export async function
resendVerification(
  emailInput: string,
): Promise<void> {
  const email =
    normalizeEmail(
      emailInput ?? "",
    );

  /*
   * Resposta deliberadamente
   * genérica para não revelar
   * quais e-mails existem.
   */
  if (!email) return;

  const user =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });

  if (!user) return;

  if (
    user.status !==
      "PENDING_EMAIL" ||
    user.emailVerifiedAt
  ) {
    return;
  }

  try {
    await sendUserVerification(
      user,
    );
  } catch (error) {
    console.error(
      "[EMAIL] Falha ao reenviar verificação:",
      error,
    );
  }
}

export async function login(
  data: LoginData,
): Promise<{
  token: string;
  user: PublicUser;
}> {
  const email =
    normalizeEmail(
      data.email ?? "",
    );

  const password =
    data.password ?? "";

  if (!email || !password) {
    throw new Error(
      "INVALID_CREDENTIALS",
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });

  if (!user) {
    throw new Error(
      "INVALID_CREDENTIALS",
    );
  }

  const passwordOk =
    await bcrypt.compare(
      password,
      user.passwordHash,
    );

  if (!passwordOk) {
    throw new Error(
      "INVALID_CREDENTIALS",
    );
  }

  if (
    user.status ===
    "PENDING_EMAIL"
  ) {
    throw new Error(
      "EMAIL_NOT_VERIFIED",
    );
  }

  if (
    user.status ===
    "BLOCKED"
  ) {
    throw new Error(
      "USER_BLOCKED",
    );
  }

  if (
    user.status !==
    "ACTIVE"
  ) {
    throw new Error(
      "INVALID_USER_STATUS",
    );
  }

  const options: SignOptions = {
    expiresIn:
      config.auth
        .jwtExpiresIn as
        SignOptions["expiresIn"],
  };

  const token =
    jwt.sign(
      {
        role:
          String(user.role),
      },
      config.auth.jwtSecret,
      {
        ...options,
        subject:
          String(user.id),
      },
    );

  return {
    token,
    user: publicUser(user),
  };
}

export async function
getCurrentUser(
  userId: number,
): Promise<PublicUser> {
  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

  if (!user) {
    throw new Error(
      "USER_NOT_FOUND",
    );
  }

  if (
    user.status !==
    "ACTIVE"
  ) {
    throw new Error(
      "USER_NOT_ACTIVE",
    );
  }

  return publicUser(user);
}