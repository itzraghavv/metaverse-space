import { Router } from "express";
import { userMiddleware } from "../../middlewares/auth";
import { UpdateMetadataSchema } from "../../types";
import client from "@repo/db/client";

export const userRouter = Router();

userRouter.post("/metadata", userMiddleware, async (req, res) => {
  const parsedData = UpdateMetadataSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.status(400).json({ message: "Validation Failed" });
    return;
  }

  try {
    await client.user.update({
      where: {
        id: req.userId,
      },
      data: {
        avatarId: parsedData.data.avatarId,
      },
    });

    res.json({ message: "User metadata updated" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Server error" });
  }
});

userRouter.get("/metadata/bulk", async (req, res) => {
  //!TODO:  add zod validation here
  const userIdString = (req.query.ids ?? "[]") as string;
  const userIds = userIdString.slice(1, userIdString?.length - 1).split(",");

  const metadata = await client.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      id: true,
      avatar: true,
    },
  });

  res.json({
    avatars: metadata.map((m) => ({
      userId: m.id,
      avatarId: m.avatar?.imageUrl,
    })),
  });
});
