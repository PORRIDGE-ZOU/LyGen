import { newLayer } from "@/app/page";
import { AnimationProps } from "./types/index";
import { allObjects, globalRegulator, p_keyframes } from "./globals";
import * as fabric from "fabric";
import { FabricText } from "fabric";

export function setText(
  group: fabric.Group,
  props: AnimationProps,
  cv: fabric.Canvas
) {
  var length = group._objects.length;
  for (var i = 0; i < length; i++) {
    group.item(i).set({
      fill: props.fill,
      fontFamily: props.fontFamily,
    });
    cv.renderAll();
  }
}

export function renderText_LetterWise(
  string: string,
  props: AnimationProps,
  x: number,
  y: number,
  cv: fabric.Canvas,
  id: string,
  isnew: boolean,
  // start: number,
  startTime?: number,
  endTime?: number,
  offset?: number,
  defaultScaleX?: number,
  defaultScaleY?: number
): fabric.Group {
  var textOffset = 0;
  var groupItems: fabric.Object[] = [];
  if (offset && startTime) {
    startTime -= offset;
  }

  function renderLetter(letter: string): fabric.Text {
    var text = new FabricText(letter, {
      left: textOffset,
      top: 0,
      fill: props.fill,
      fontFamily: props.fontFamily,
      fontSize: 24,
      fontWeight: 400,
      opacity: 1,
    });
    text.set({
      defaultLeft: text.left,
      defaultTop: text.top,
      defaultScaleX: defaultScaleX ? defaultScaleX : 1,
      defaultScaleY: defaultScaleY ? defaultScaleY : 1,
      scaleX: defaultScaleX ? defaultScaleX : 1,
      scaleY: defaultScaleY ? defaultScaleY : 1,
    });
    if (startTime && endTime) {
      text.set("notnew", true);
      text.set("starttime", startTime);
      text.set("endtime", endTime);
    }
    // TODO: NOTE: For whatever reason, the width of the text is not being calculated correctly.
    // it just doesn't consider the scaling factor. -- GEORGE
    textOffset += text.get("width");
    return text;
  }

  for (var i = 0; i < string.length; i++) {
    groupItems.push(renderLetter(string.charAt(i)));
  }

  var result = new fabric.Group(groupItems, {
    stroke: "#FFFFFF",
    strokeUniform: true,
    paintFirst: "stroke",
    strokeWidth: 0,
    originX: "center",
    originY: "center",
    left: x,
    top: y,
    cursorWidth: 1,
    cursorDuration: 1,
    cursorDelay: 250,
    assetType: "animatedText",
    id: id,
    strokeDashArray: [],
    inGroup: false,
  });

  // this is always true now.
  if (isnew) {
    result.set({
      notnew: true,
      starttime: startTime,
      endtime: endTime,
    });
  }
  result.objectCaching = false;
  cv.add(result);
  cv.renderAll();
  newLayer(
    result,
    allObjects,
    p_keyframes,
    cv,
    props.duration,
    globalRegulator.currentTime
  );

  result._objects.forEach(function (object: any, index: number) {
    result!.item(index).set({
      defaultLeft: result.item(index).defaultLeft! - result.width / 2,
      defaultTop: result.item(index).defaultTop! - result.height / 2,
    });
  });

  cv.setActiveObject(result);
  cv.bringObjectToFront(result);
  return result;
}

export function renderText(
  string: string,
  props: AnimationProps,
  x: number,
  y: number,
  cv: fabric.Canvas,
  id: string,
  isnew: boolean,
  // start: number,
  startTime?: number,
  endTime?: number,
  offset?: number,
  defaultScaleX?: number,
  defaultScaleY?: number
): FabricText {
  if (offset && startTime) {
    startTime -= offset;
  }

  let result = new FabricText(string, {
    stroke: "#FFFFFF",
    strokeUniform: true,
    paintFirst: "stroke",
    strokeWidth: 0,
    originX: "center",
    originY: "center",
    left: x,
    top: y,
    cursorWidth: 1,
    cursorDuration: 1,
    cursorDelay: 250,
    assetType: "animatedText",
    id: id,
    strokeDashArray: [],
    inGroup: false,
    fill: props.fill,
    fontFamily: props.fontFamily,
    fontSize: 24,
    fontWeight: 400,
    opacity: 1,
  });
  result.set({
    defaultLeft: result.left,
    defaultTop: result.top,
    defaultScaleX: defaultScaleX ? defaultScaleX : 1,
    defaultScaleY: defaultScaleY ? defaultScaleY : 1,
    scaleX: defaultScaleX ? defaultScaleX : 1,
    scaleY: defaultScaleY ? defaultScaleY : 1,
  });

  if (startTime && endTime) {
    result.set({
      notnew: true,
      starttime: startTime,
      endtime: endTime,
    });
  }
  result.set({ animateDuration: props.duration });

  result.objectCaching = false;
  cv.add(result);
  newLayer(
    result,
    allObjects,
    p_keyframes,
    cv,
    props.duration,
    globalRegulator.currentTime
  );
  // cv.setActiveObject(result);
  // cv.bringObjectToFront(result);
  cv.renderAll();
  return result;
}

/**
 * If importance >= 0.5,
 * Lerp from original to (original * scale) by (importance - 0.5).
 * If importance < 0.5,
 * Lerp from original to (original * 1/scale) by (0.5 - importance).
 * @NOTE importance should be between 0 and 1.
 * @returns the lerped value.
 */
export function LerpImportance(
  original: number,
  scale: number,
  importance: number
) {
  if (importance == 0.5) {
    return original;
  }
  // lerp from 1 to 1 * scaleFactor
  if (importance >= 0.5) {
    return (
      original +
      ((importance - 0.5) / (1 - 0.5)) * (original * scale - original)
    );
  } else {
    return (
      original +
      ((0.5 - importance) / 0.5) * (original * (1 / scale) - original)
    );
  }
}
