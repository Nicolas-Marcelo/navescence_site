import bcrypt from "bcryptjs";

import jwt, {
  type SignOptions,
} from "jsonwebtoken";

import { config } from "../config/env.js";
import { prisma } from "../database/prisma.js";

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

  if (name.length > 120) {
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

  if (
    !regex.test(email) ||
    email.length > 180
  ) {
    throw new Error(
      "INVALID_EMAIL",
    );
  }
}

function validatePassword(
  password: string,
): void {
  const valid =
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 100 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password);

  if (!valid) {
    throw new Error(
      "WEAK_PASSWORD",
    );
  }
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

        // Confirmação de e-mail
        // temporariamente desativada.
        status: "ACTIVE",
      },
    });

  return publicUser(user);
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

  if (
    !email ||
    !password
  ) {
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
    "BLOCKED"
  ) {
    throw new Error(
      "USER_BLOCKED",
    );
  }

  /*
   * Enquanto a confirmação por
   * e-mail estiver desativada,
   * contas PENDING_EMAIL antigas
   * também poderão entrar.
   */
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
    user.status ===
    "BLOCKED"
  ) {
    throw new Error(
      "USER_BLOCKED",
    );
  }

  return publicUser(user);
}