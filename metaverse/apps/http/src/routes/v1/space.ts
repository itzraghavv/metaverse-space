import { Router } from "express";
import {
  AddElementSchema,
  CreateSpaceSchema,
  DeleteElementSchema,
} from "../../types";
import { userMiddleware } from "../../middlewares/auth";
import client from "@repo/db/client";

export const spaceRouter = Router();

spaceRouter.post("/", userMiddleware, async (req, res) => {
  const parsedData = CreateSpaceSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }

  if (!parsedData.data.mapId) {
    const space = await client.space.create({
      data: {
        name: parsedData.data.name,
        width: parseInt(parsedData.data.dimensions.split("x")[0]),
        height: parseInt(parsedData.data.dimensions.split("x")[1]),
        creatorId: req.userId,
      },
    });

    res.json({ spaceId: space.id });
    return;
  }

  const map = await client.map.findFirst({
    where: {
      id: parsedData.data.mapId,
    },
    select: {
      width: true,
      height: true,
      MapElements: true,
    },
  });

  if (!map) {
    res.status(403).json({ message: "Map not found" });
    return;
  }

  let space = await client.$transaction(async () => {
    const space = await client.space.create({
      data: {
        name: parsedData.data.name,
        width: map.width,
        height: map.height,
        creatorId: req.userId!,
      },
    });

    await client.spaceElements.createMany({
      data: map.MapElements.map((e) => ({
        spaceId: space.id,
        elementId: e.elementId,
        x: e.x!,
        y: e.y!,
      })),
    });

    return space;
  });

  res.json({ spaceId: space.id });
});

spaceRouter.delete("/element", userMiddleware, async (req, res) => {
  const parsedData = DeleteElementSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }

  try {
    const spaceElement = await client.spaceElements.findFirst({
      where: {
        id: parsedData.data.id,
      },
      include: {
        space: true,
      },
    });

    if (
      !spaceElement?.space.creatorId ||
      spaceElement.space.creatorId !== req.userId
    ) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    await client.spaceElements.delete({
      where: {
        id: parsedData.data.id,
      },
    });

    res.json({ message: "Element Deleted" });
  } catch (error) {
    console.log(error);
  }
});

spaceRouter.delete("/:spaceId", userMiddleware, async (req, res) => {
  const space = await client.space.findUnique({
    where: {
      id: req.params.spaceId,
    },
    select: {
      creatorId: true,
    },
  });

  if (!space) {
    res.status(400).json({ message: "Space not Found" });
    return;
  }

  if (space.creatorId !== req.userId) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }

  await client.space.delete({
    where: {
      id: req.params.spaceId,
    },
  });

  res.json({ message: "Space deleted " });
});

spaceRouter.get("/all", userMiddleware, async (req, res) => {
  try {
    const spaces = await client.space.findMany({
      where: {
        creatorId: req.userId,
      },
    });

    res.json({
      spaces: spaces.map((space) => ({
        id: space.id,
        name: space.name,
        thumbnail: space.thumbnail,
        dimensions: `${space.width}x${space.height}`,
      })),
    });
  } catch (error) {
    console.log(error);
  }
});

spaceRouter.post("/element", userMiddleware, async (req, res) => {
  const parsedData = AddElementSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.status(400).json({ message: "Validation Failed" });
    return;
  }

  try {
    const space = await client.space.findUnique({
      where: {
        id: req.body.spaceId,
        creatorId: req.userId!,
      },
      select: {
        width: true,
        height: true,
      },
    });

    if (
      req.body.x < 0 ||
      req.body.y < 0 ||
      req.body.x > space?.width! ||
      req.body.y > space?.height!
    ) {
      res.status(400).json({ message: "Point is outside of the boundary" });
      return;
    }

    if (!space) {
      res.status(400).json({ message: "Space not found" });
      return;
    }

    await client.spaceElements.create({
      data: {
        spaceId: req.body.spaceId,
        elementId: req.body.elementId,
        x: req.body.x,
        y: req.body.y,
      },
    });

    res.json({ message: "Element Added" });
  } catch (error) {
    console.log(error);
  }
});

spaceRouter.get("/:spaceId", userMiddleware, async (req, res) => {
  try {
    const space = await client.space.findUnique({
      where: {
        id: req.params.spaceId,
      },
      include: {
        elements: {
          include: {
            element: true,
          },
        },
      },
    });

    if (!space) {
      res.status(400).json({ message: "Space not found" });
      return;
    }

    res.json({
      dimensions: `${space.width}x${space.height}`,
      elements: space.elements.map((element) => ({
        id: element.id,
        element: {
          id: element.element.id,
          imageUrl: element.element.imageUrl,
          width: element.element.width,
          height: element.element.height,
          static: element.element.static,
        },
        x: element.x,
        y: element.y,
      })),
    });
  } catch (error) {
    console.log(error);
  }
});
