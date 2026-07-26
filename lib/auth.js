import jwt from "jsonwebtoken";
import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET belum diset.");
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function requireAuth(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Token tidak ditemukan.",
    });
    return null;
  }

  const token = authHeader.substring(7);

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      error: "Token tidak valid.",
    });
    return null;
  }

  const user = await prisma.users.findUnique({
    where: {
      id: payload.id,
    },
    include: {
      profiles: true,
    },
  });

  if (!user) {
    res.status(401).json({
      error: "User sudah dihapus.",
    });
    return null;
  }

  return user;
}

export async function requireRole(
  req,
  res,
  allowedRoles = ["admin", "siswa"]
) {
  const user = await requireAuth(req, res);

  if (!user) return null;

  if (!user.profiles) {
    res.status(403).json({
      error: "Profile tidak ditemukan.",
    });
    return null;
  }

  if (!allowedRoles.includes(user.profiles.role)) {
    res.status(403).json({
      error: "Akses ditolak.",
    });
    return null;
  }

  return {
    user,
    profile: user.profiles,
  };
}