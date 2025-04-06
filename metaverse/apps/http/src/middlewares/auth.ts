import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    export interface Request {
      role?: "Admin" | "User";
      userId: string;
    }
  }
}

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers["authorization"];
  const token = header?.split(" ")[1];

  if (!token) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      role: string;
      userId: string;
    };
    if (decoded.role !== "Admin") {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }
    req.userId = decoded.userId;
    next();
  } catch (e) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

export const userMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers["authorization"];
  const token = header?.split(" ")[1];

  if (!token) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      role: string;
      userId: string;
    };
    req.userId = decoded.userId;
    next();
  } catch (e) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
