import client from "@repo/db/client";
import { Router } from "express";
import { adminMiddleware } from "../../middlewares/auth";
import {
  AddElementSchema,
  CreateAvatarSchema,
  CreateElementSchema,
  CreateMapSchema,
  UpdateElementSchema,
} from "../../types";

export const adminRouter = Router();

adminRouter.post("/element", adminMiddleware, async (req, res) => {
  const parsedData = CreateElementSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }

  const element = await client.element.create({
    data: {
      imageUrl: parsedData.data.imageUrl,
      height: parsedData.data.height,
      width: parsedData.data.width,
      static: parsedData.data.static,
    },
  });

  res.json({ message: "Element Created", id: element.id });
});

adminRouter.put("/element/:elementId", adminMiddleware, async (req, res) => {
  const parsedData = UpdateElementSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }

  await client.element.update({
    where: {
      id: req.params.elementId,
    },
    data: {
      imageUrl: parsedData.data.imageUrl,
    },
  });

  res.json({ message: "Element Updated" });
});

adminRouter.post("/avatar", adminMiddleware, async (req, res) => {
  const parsedData = CreateAvatarSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }

  const avatar = await client.avatar.create({
    data: {
      name: parsedData.data.name,
      imageUrl: parsedData.data.imageUrl,
    },
  });

  res.json({ avatarId: avatar.id });
});

adminRouter.post("/map", adminMiddleware, async (req, res) => {
  const parsedData = CreateMapSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }

  const map = await client.map.create({
    data: {
      name: parsedData.data.name,
      width: parseInt(parsedData.data.dimensions.split("x")[0]),
      height: parseInt(parsedData.data.dimensions.split("x")[1]),
      thumbnail: parsedData.data.thumbnail,
      MapElements: {
        create: parsedData.data.defaultElements.map((element) => ({
          elementId: element.elementId,
          x: element.x,
          y: element.y,
        })),
      },
    },
  });

  res.json({ message: "Map Created", id: map.id });
});
