import { Router } from "express";
import { userRouter } from "./user";
import { adminRouter } from "./admin";
import { spaceRouter } from "./space";
import { SignInSchema, SignUpSchema } from "../../types";
import client from "@repo/db/client";
import { compare, hash } from "../../scrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config";

export const router = Router();

router.post("/sign-up", async (req, res) => {
  const parsedData = SignUpSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.status(400).json({ message: "SignUp Validation Failed" });
    return;
  }

  const hashedPassword = await hash(parsedData.data.password);

  try {
    const user = await client.user.create({
      data: {
        username: parsedData.data.username,
        password: hashedPassword,
        role: parsedData.data.type === "admin" ? "Admin" : "User",
      },
    });

    res.json({
      userId: user.id,
    });
  } catch (error) {
    res.status(400).json({ message: "User already exists" });
  }
});

router.post("/sign-in", async (req, res) => {
  const parsedData = SignInSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.status(403).json({
      message: "Validation Failed ",
    });
    return;
  }

  try {
    const user = await client.user.findUnique({
      where: {
        username: parsedData.data.username,
      },
    });

    if (!user) {
      res.status(403).json({ message: "User not found" });
      return;
    }

    const isValid = await compare(parsedData.data.password, user.password);

    if (!isValid) {
      res.status(403).json({ message: "Invalid Password" });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      JWT_SECRET
    );

    res.json({
      token,
    });
  } catch (error) {
    res.status(400).json({ message: "Internal server error" });
  }
});

router.get("/element", async (req, res) => {
  try {
    const elements = await client.element.findMany();

    res.json({
      elements: elements.map((element) => ({
        id: element.id,
        imageUrl: element.imageUrl,
        static: element.static,
        height: element.height,
        widthL: element.width,
      })),
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/avatars", async (req, res) => {
  const avatars = await client.avatar.findMany();

  res.json({
    avatars: avatars.map((avatar) => ({
      id: avatar.id,
      imageUrl: avatar.imageUrl,
      name: avatar.name,
    })),
  });
});

router.use("/user", userRouter);
router.use("/admin", adminRouter);
router.use("/space", spaceRouter);
