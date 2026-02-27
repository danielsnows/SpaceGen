/// <reference types="@figma/plugin-typings" />

declare const __html__: string;

const INSERT_MAX = 20;

interface InsertPost {
  id: string;
  title: string;
  imageUrl: string;
  platform: string;
  imageBytes: Uint8Array;
}

async function createImageFromBytes(bytes: Uint8Array) {
  // Alguns ambientes do Figma expõem createImageAsync com assinatura diferente
  // (esperando string em vez de Uint8Array). Como já temos os bytes da imagem,
  // usamos sempre createImage com Uint8Array, que é suportado de forma estável.
  const anyFigma = figma as unknown as { createImage: (data: Uint8Array) => Image };
  const img = anyFigma.createImage(bytes);
  return img;
}

figma.showUI(__html__, { width: 1200, height: 800 });

figma.ui.onmessage = async (msg: { type: string; payload?: { posts: InsertPost[] } }) => {
  const payload = msg.payload;
  const postsList = payload && payload.posts;
  if (msg.type === "INSERT_POSTS" && postsList && postsList.length > 0) {
    const posts = postsList.slice(0, INSERT_MAX);
    let font: { family: string; style: string } = { family: "Inter", style: "Regular" };
    try {
      await figma.loadFontAsync(font);
    } catch (e) {
      font = { family: "Roboto", style: "Regular" };
      try {
        await figma.loadFontAsync(font);
      } catch (e2) {
        figma.notify("Could not load font");
        figma.ui.postMessage({ type: "INSERT_ERROR", error: "Font load failed" });
        return;
      }
    }

    const parent = figma.createFrame();
    parent.name = "Design Feed";
    parent.layoutMode = "HORIZONTAL";
    parent.primaryAxisSizingMode = "AUTO";
    parent.counterAxisSizingMode = "AUTO";
    parent.itemSpacing = 24;
    parent.paddingLeft = 0;
    parent.paddingRight = 0;
    parent.paddingTop = 0;
    parent.paddingBottom = 0;
    parent.clipsContent = false;

    const frameWidth = 500;
    const padding = 16;
    const spacing = 12;

    let xOffset = 0;
    const created: SceneNode[] = [];

    for (const post of posts) {
      try {
        const image = await createImageFromBytes(post.imageBytes);
        const rect = figma.createRectangle();

        // Calcula altura da imagem mantendo a proporção original,
        // com base na largura interna disponível no card.
        const innerWidth = frameWidth - padding * 2;
        let rectHeight = 320;
        try {
          const size = await image.getSizeAsync();
          if (size.width && size.height) {
            rectHeight = (innerWidth * size.height) / size.width;
          }
        } catch (_err) {
          // Se falhar, usa altura padrão
        }

        rect.resize(innerWidth, rectHeight);
        rect.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: image.hash }];
        rect.name = "Image";

        const titleNode = figma.createText();
        titleNode.characters = post.title.length > 60 ? post.title.slice(0, 57) + "..." : post.title;
        titleNode.fontSize = 14;
        titleNode.name = "Title";

        const platformNode = figma.createText();
        platformNode.characters = post.platform;
        platformNode.fontSize = 11;
        platformNode.fills = [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.4 } }];
        platformNode.name = "Platform";

        const card = figma.createFrame();
        card.name = post.title.slice(0, 50) || "Post";
        card.layoutMode = "VERTICAL";
        card.primaryAxisSizingMode = "AUTO";
        card.counterAxisSizingMode = "FIXED";
        card.counterAxisAlignItems = "MIN";
        card.itemSpacing = spacing;
        card.paddingLeft = padding;
        card.paddingRight = padding;
        card.paddingTop = padding;
        card.paddingBottom = padding;
        card.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
        card.strokes = [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 } }];
        card.strokeWeight = 1;
        card.cornerRadius = 8;

        card.appendChild(rect);
        card.appendChild(titleNode);
        card.appendChild(platformNode);
        // Largura fixa e altura \"Hug contents\" (auto layout vertical)
        card.resizeWithoutConstraints(frameWidth, card.height);
        card.x = xOffset;
        parent.appendChild(card);
        created.push(card);
        xOffset += frameWidth + 24;
      } catch (err) {
        console.error("Insert post failed:", post.id, err);
        figma.notify(`Failed to add: ${post.title.slice(0, 30)}...`);
      }
    }

    if (created.length > 0) {
      const sel = figma.currentPage.selection;
      let baseX = 0;
      let baseY = 0;
      if (sel.length === 1 && "x" in sel[0] && "y" in sel[0]) {
        baseX = sel[0].x;
        baseY = sel[0].y;
      }
      parent.x = baseX;
      parent.y = baseY;
      figma.currentPage.appendChild(parent);
      figma.currentPage.selection = [parent];
      figma.viewport.scrollAndZoomIntoView([parent]);
      figma.notify(`Added ${created.length} post(s) to canvas`);
      figma.ui.postMessage({ type: "INSERT_DONE", count: created.length });
    } else {
      figma.ui.postMessage({ type: "INSERT_ERROR", error: "No posts could be added" });
    }
    return;
  }
};
