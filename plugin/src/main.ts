/// <reference types="@figma/plugin-typings" />

import { getPlatformConfig } from "./ui/lib/platforms";
import spacegenLogoSvg from "./ui/assets/spacegen-logo.svg?raw";
import snowsLogoSvg from "./ui/assets/snows-logo.svg?raw";

declare const __html__: string;

const INSERT_MAX = 20;

interface InsertPost {
  id: string;
  title: string;
  imageUrl: string;
  platform: string;
  imageBytes: Uint8Array;
}

function hexToFigmaColor(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 6 || !/^[0-9a-fA-F]+$/.test(clean)) {
    return { r: 1, g: 1, b: 1 };
  }
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return { r: r / 255, g: g / 255, b: b / 255 };
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
    let regularFont: { family: string; style: string } = { family: "Inter", style: "Regular" };
    let mediumFont: { family: string; style: string } = { family: "Inter", style: "Medium" };
    try {
      await figma.loadFontAsync(regularFont);
      await figma.loadFontAsync(mediumFont);
    } catch (e) {
      regularFont = { family: "Roboto", style: "Regular" };
      mediumFont = { family: "Roboto", style: "Medium" };
      try {
        await figma.loadFontAsync(regularFont);
        await figma.loadFontAsync(mediumFont);
      } catch (e2) {
        figma.notify("Could not load font");
        figma.ui.postMessage({ type: "INSERT_ERROR", error: "Font load failed" });
        return;
      }
    }

    const parent = figma.createFrame();
    parent.name = "Inspiration Collection";
    parent.layoutMode = "VERTICAL";
    parent.primaryAxisSizingMode = "AUTO";
    parent.counterAxisSizingMode = "AUTO";
    parent.itemSpacing = 24;
    parent.paddingLeft = 40;
    parent.paddingRight = 40;
    parent.paddingTop = 40;
    parent.paddingBottom = 40;
    parent.fills = [
      {
        type: "SOLID",
        color: hexToFigmaColor("#D8DCE0"),
      },
    ];
    parent.clipsContent = false;

    const topBar = figma.createFrame();
    topBar.name = "top-bar";
    topBar.layoutMode = "HORIZONTAL";
    topBar.primaryAxisSizingMode = "AUTO";
    topBar.counterAxisSizingMode = "AUTO";
    topBar.counterAxisAlignItems = "CENTER";
    topBar.primaryAxisAlignItems = "SPACE_BETWEEN";
    topBar.paddingLeft = 0;
    topBar.paddingRight = 0;
    topBar.paddingTop = 40;
    topBar.paddingBottom = 40;
    topBar.itemSpacing = 0;
    topBar.fills = [];
    topBar.strokes = [];
    topBar.layoutAlign = "STRETCH";

    const logoLeft = figma.createNodeFromSvg(spacegenLogoSvg);
    logoLeft.name = "spacegen-logo";

    const poweredFrame = figma.createFrame();
    poweredFrame.name = "powered";
    poweredFrame.layoutMode = "HORIZONTAL";
    poweredFrame.primaryAxisSizingMode = "AUTO";
    poweredFrame.counterAxisSizingMode = "AUTO";
    poweredFrame.counterAxisAlignItems = "CENTER";
    poweredFrame.itemSpacing = 20;
    poweredFrame.fills = [];
    poweredFrame.strokes = [];

    const poweredText = figma.createText();
    poweredText.characters = posts.length === 1 ? "By" : "Made with ❤ by";
    poweredText.fontName = regularFont;
    poweredText.fontSize = 14;
    poweredText.textCase = "UPPER";
    poweredText.letterSpacing = { value: 8, unit: "PIXELS" };
    poweredText.fills = [
      {
        type: "SOLID",
        color: hexToFigmaColor("#9E9E9E"),
      },
    ];
    poweredText.name = "Made with ❤ by";

    const snowsLogo = figma.createNodeFromSvg(snowsLogoSvg);
    snowsLogo.name = "snows-logo";

    poweredFrame.appendChild(poweredText);
    poweredFrame.appendChild(snowsLogo);

    topBar.appendChild(logoLeft);
    topBar.appendChild(poweredFrame);

    const cardsRow = figma.createFrame();
    cardsRow.name = "Cards";
    cardsRow.layoutMode = "HORIZONTAL";
    cardsRow.primaryAxisSizingMode = "AUTO";
    cardsRow.counterAxisSizingMode = "AUTO";
    cardsRow.counterAxisAlignItems = "MIN";
    cardsRow.itemSpacing = 24;
    cardsRow.fills = [];
    cardsRow.strokes = [];
    cardsRow.clipsContent = false;
    cardsRow.layoutAlign = "STRETCH";

    parent.appendChild(topBar);
    parent.appendChild(cardsRow);
    topBar.layoutSizingHorizontal = "FILL";
    cardsRow.layoutSizingHorizontal = "FILL";

    const frameWidth = 500;
    const padding = 16;
    const spacing = 12;

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
        rect.cornerRadius = 10;
        rect.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: image.hash }];
        rect.name = "Image";

        const titleNode = figma.createText();
        titleNode.characters = post.title.length > 60 ? post.title.slice(0, 57) + "..." : post.title;
        titleNode.fontName = mediumFont;
        titleNode.fontSize = 28;
        titleNode.name = "Title";

        const platformConfig = getPlatformConfig(post.platform);
        const platformLabel = (platformConfig && platformConfig.label) || post.platform;
        const brandHex = (platformConfig && platformConfig.brandColor) || "#6C788A";
        const brandColor = hexToFigmaColor(brandHex);

        const platformTag = figma.createFrame();
        platformTag.name = "Platform Tag";
        platformTag.layoutMode = "HORIZONTAL";
        platformTag.primaryAxisSizingMode = "AUTO";
        platformTag.counterAxisSizingMode = "AUTO";
        platformTag.counterAxisAlignItems = "CENTER";
        platformTag.itemSpacing = 6;
        platformTag.paddingLeft = 8;
        platformTag.paddingRight = 8;
        platformTag.paddingTop = 4;
        platformTag.paddingBottom = 4;
        platformTag.cornerRadius = 4;
        platformTag.fills = [
          {
            type: "SOLID",
            color: brandColor,
            opacity: 0.15,
          },
        ];
        platformTag.strokes = [];

        const platformText = figma.createText();
        platformText.characters = platformLabel;
        platformText.fontName = mediumFont;
        platformText.fontSize = 12;
        platformText.fills = [
          {
            type: "SOLID",
            color: brandColor,
          },
        ];
        platformText.name = "Platform";

        platformTag.appendChild(platformText);

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
        card.strokes = [{ type: "SOLID", color: { r: 230 / 255, g: 230 / 255, b: 230 / 255 } }];
        card.strokeWeight = 1;
        card.cornerRadius = 20;

        card.appendChild(rect);
        card.appendChild(titleNode);
        card.appendChild(platformTag);
        // Largura fixa e altura \"Hug contents\" (auto layout vertical)
        card.resizeWithoutConstraints(frameWidth, card.height);
        cardsRow.appendChild(card);
        created.push(card);
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
