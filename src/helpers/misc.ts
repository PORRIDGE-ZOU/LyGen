import { FabricObject } from "fabric";
import * as fabric from "fabric";
import {
  allAnimatedTexts,
  allObjects,
  p_keyframes,
  globalRegulator,
  activeLyrics,
} from "./globals";
import { newLayer } from "@/app/page";
import { AnimatedText } from "./classes/AnimatedText";

// Deselect and reselect an object
export function reselect(selection: FabricObject, canvas: fabric.Canvas) {
  if (!selection) {
    console.warn("[reselect] selection is undefined. May be some error.");
    return;
  }
  if (selection.get("type") == "activeSelection") {
    var objs = [];
    for (let so of (selection as fabric.ActiveSelection)._objects) {
      for (let obj of canvas.getObjects()) {
        if (obj.get("id") === so.get("id")) {
          objs.push(obj);
          break;
        }
      }
    }
    canvas.setActiveObject(
      new fabric.ActiveSelection(objs, {
        canvas: canvas,
      })
    );
    canvas.renderAll();
  } else {
    if (selection.get("type") == "group") {
      canvas.setActiveObject(
        canvas.getItemById(selection.get("id")) as FabricObject
      );
    } else {
      canvas.setActiveObject(selection);
    }
    canvas.renderAll();
  }
}

export function deleteObject(
  object: FabricObject,
  def = true,
  canvas: fabric.Canvas
) {
  if (object.get("assetType") == "animatedText" && def) {
    var animatedtext = $.grep(allAnimatedTexts, function (a) {
      return a.id != object.id;
    });
  }
  if (object.type == "image") {
    // var temp = files.find((x) => x.name == object.get("id"));
    // files = $.grep(files, function (a) {
    //   return a != temp.name;
    // });
  }
  // $(".layer[data-object='" + object.get("id") + "']").remove();
  // $("#" + object.get("id")).remove();
  // keyframes = $.grep(keyframes, function (e) {
  //   return e.id != object.get("id");
  // });
  // var this_p_keyframes = $.grep(p_keyframes, function (e) {
  //   return e.id != object.get("id");
  // });
  // var objects = $.grep(allObjects, function (e) {
  //   return e.id != object.get("id");
  // });
  canvas.remove(object);
  canvas.renderAll();
  canvas.discardActiveObject();
  // save();
  // if (objects.length == 0) {
  //   $("#nolayers").removeClass("yaylayers");
  // }
}

const addRect = (canvas?: fabric.Canvas) => {
  const rect = new fabric.Rect({
    height: 280,
    width: 200,
    stroke: "#2BEBC8",
  });
  canvas?.add(rect);
  canvas?.requestRenderAll();
};

/**  Creates a new fabric.Textbox object and adds it to the canvas.
 * @param {string} text - The content of the text.
 * @param {number} x - The x-coordinate of the text.
 * @param {number} y - The y-coordinate of the text.
 * @param {number} width - The width of the text. (NOT USED)
 * @param {boolean} center - Whether to center the text on the canvas.
 * @param {string} font - The font family of the text.
 */
export const newTextbox = (
  fontsize: number,
  fontweight: number,
  text: string,
  x: number,
  y: number,
  width: number,
  center: boolean,
  font: string,
  canvas?: fabric.Canvas,
  startTime?: number,
  endTime?: number
) => {
  console.log("[newTextbox] called");
  var newtext = new fabric.Textbox(text, {
    left: x,
    top: y,
    originX: "center",
    originY: "center",
    fontFamily: "Inter",
    fill: "#ffffff",
    fontSize: fontsize,
    fontWeight: fontweight,
    textAlign: "center",
    cursorWidth: 1,
    stroke: "#ffffff",
    strokeWidth: 0,
    cursorDuration: 1,
    paintFirst: "stroke",
    objectCaching: false,
    absolutePositioned: true,
    strokeUniform: true,
    inGroup: false,
    cursorDelay: 250,
    strokeDashArray: null,
    width: calculateTextWidth(
      text,
      fontweight + " " + fontsize + "px Inter",
      canvas
    ),
    id: "Text" + globalRegulator.getAndUpdateCurrentIndex(),
    // shadow: {
    //   color: "#000",
    //   offsetX: 0,
    //   offsetY: 0,
    //   blur: 0,
    //   includeDefaultValues: true,
    //   nonScaling: false,
    // },
  });
  newtext.setControlsVisibility({
    mt: false,
    mb: false,
  });
  canvas?.add(newtext);
  if (startTime && endTime) {
    newtext.set("notnew", true);
    newtext.set("starttime", startTime);
    newtext.set("endtime", endTime);
  }
  // Attempt Fix for text top and left not correctly being set to center: move
  // setactiveobject to the end of function. --GEORGE
  // THIS IS NOT FIXING THE ISSUE. DAMN. --GEORGE
  // add this text element as a layer (a layer is a row in the timeline)
  newLayer(newtext, allObjects, p_keyframes, canvas!, 5000, 0);
  // canvas.setActiveObject(newtext);
  // canvas?.bringToFront(newtext);
  canvas?.bringObjectToFront(newtext);
  newtext.enterEditing();
  newtext.selectAll();
  canvas?.renderAll();
  if (center) {
    newtext.set("left", canvas?.get("left") + canvas?.get("width") / 2);
    newtext.set("top", canvas?.get("top") + canvas?.get("height") / 2);
    console.log("[newTextbox] centering text (this is a correct centering.)");
    // canvas?.centerObject(newtext);
    canvas?.renderAll();
  }
  // set active here!
  canvas?.setActiveObject(newtext);
  newtext.set("fontFamily", font);
  canvas?.renderAll();
};

const calculateTextWidth = (
  text: string,
  font?: string,
  canvas?: fabric.Canvas
) => {
  if (!canvas) {
    console.error("[calculateTextWidth] canvas is undefined");
  }
  let ctx = canvas!.getContext(); // remove "2d" --9.23, GEORGE
  if (font) ctx.font = font;
  return ctx!.measureText(text).width + 0;
};

export function realignLineOfText(line: AnimatedText[], canvas: fabric.Canvas) {
  let ctx = canvas.getContext();
  let widthOfSpace = ctx.measureText(" ").width;
  let centerX = canvas.width / 2;
  let lineWidth = 0;
  let textWidths: number[] = [];
  line.forEach((text, index) => {
    let originalTextWidth = ctx.measureText(text.text).width;
    let actualWidth = originalTextWidth * text.props.defaultScaleX!;
    textWidths.push(actualWidth);
    if (index != line.length - 1) {
      actualWidth += widthOfSpace;
    } else {
    }
    lineWidth += actualWidth;
  });

  let nextXPos = centerX - lineWidth / 2;
  line.forEach((text, index) => {
    nextXPos += textWidths[index] / 2;
    text.textFabricObject!.set("left", nextXPos);
    text.textFabricObject!.set("defaultLeft", nextXPos);
    text.props.left = nextXPos;
    nextXPos += textWidths[index] / 2;
    nextXPos += widthOfSpace;
  });
  canvas.renderAll();
}

export function getLineFromIndex(lineIndex: number) {
  let keys = Array.from(activeLyrics.keys());
  let changedKey = keys[lineIndex];
  let changedLine = activeLyrics.get(changedKey);
  if (!changedLine) {
    console.warn(
      `[getLineFromIndex] Line ${lineIndex} not found in the active lyrics map. Returning null.`
    );
  }
  return changedLine;
}

export function rgbToNumber(r: number, g: number, b: number) {
  return (r << 16) | (g << 8) | b;
}

export function numberToRgb(num: number) {
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return { r, g, b };
}

export function hexToRgb(hex: string) {
  // Remove the leading '#' if it's there
  hex = hex!.replace(/^#/, "");
  // Parse the r, g, b values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number): string => {
    n = isNaN(n) ? 0 : Math.max(0, Math.min(255, Math.round(n)));
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
