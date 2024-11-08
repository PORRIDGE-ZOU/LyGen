import { AnimationProps, PKeyframe } from "./types/index";
import { AllObjects, globalRegulator, P_Keyframes, PropList } from "./globals";
import * as fabric from "fabric";
import { FabricObject, FabricText } from "fabric";
import { LygenObject } from "./classes/LygenObject";
import { animate } from "./animation";

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
    AllObjects,
    P_Keyframes,
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
    AllObjects,
    P_Keyframes,
    cv,
    props.duration,
    globalRegulator.currentTime
  );
  // cv.setActiveObject(result);
  // cv.bringObjectToFront(result);
  cv.renderAll();
  return result;
}

/** Create a Layer (which is a row in the timeline).
 * AUTOIMPROVED BY CHATGPT -- GEORGE
 * @param {fabric.Object} object
 */
export function newLayer(
  newObject: FabricObject,
  objects: LygenObject[],
  p_keyframes: PKeyframe[],
  canvas: fabric.Canvas,
  duration: number,
  currenttime: number
) {
  var color: string = "#FFFFFF";

  // Determine the color based on the object's type and assetType
  // NO use for now
  if (newObject.get("type") == "image") {
    color = newObject.get("assetType") == "video" ? "#106CF6" : "#92F711";
  } else if (newObject.get("type") == "textbox") {
    color = "#F7119B";
  } else if (
    ["rect", "group", "circle", "path"].includes(newObject.get("type"))
  ) {
    color =
      newObject.get("assetType") == "animatedText"
        ? "#F7119B"
        : newObject.get("assetType") == "audio"
        ? "#11C0F7"
        : "#9211F7";
  }

  // If the object is a video, audio or lottie, add it to the timeline
  if (
    ["video", "audio"].includes(newObject.get("assetType")) ||
    newObject.get("type") == "lottie"
  ) {
    var pushObject = new LygenObject(
      newObject.get("id"),
      newObject,
      "",
      color,
      "none",
      [],
      [],
      0,
      newObject.get("duration")
    );
    objects.push(pushObject);

    // Handle keyframes for video/audio objects
    const end =
      newObject.get("duration") < duration
        ? newObject.get("duration") + currenttime
        : duration - currenttime;
    p_keyframes.push({
      start: currenttime,
      end: end,
      trimstart: 0,
      trimend: end,
      object: newObject,
      id: newObject.get("id"),
    });
    console.log(
      "[newLayer] Pushed an audio. all p_keyframes: " +
        JSON.stringify(p_keyframes, null, 2)
    );
  } else {
    var pushObject = new LygenObject(
      newObject.get("id"),
      newObject,
      newObject.get("id"),
      color,
      "none",
      [],
      []
    );
    objects.push(pushObject);

    // Handle keyframes for non-video/audio objects
    const start = newObject.get("notnew")
      ? newObject.get("starttime")
      : currenttime;
    const end = newObject.get("notnew")
      ? newObject.get("endtime")
      : currenttime + duration;

    console.log("[newLayer] start and end" + start + " " + end);

    if (newObject.get("notnew")) {
      pushObject.start = start;
      pushObject.end = end;
    }

    // NOTE: I use the ID to check if it's animated text. This is a temporary solution. -- GEORGE
    if (newObject.get("id").includes("AnimText")) {
    }

    p_keyframes.push({
      start: start,
      end: end,
      trimstart: 0,
      trimend: end,
      object: newObject,
      id: newObject.get("id"),
    });
  }

  // Set properties for objects that are not audio
  if (!newObject.get("assetType") || newObject.get("assetType") != "audio") {
    let currentObject = objects.find(
      (x) => x.id == newObject.id
    ) as fabric.Object;
    PropList.forEach(function (prop) {
      if (
        ["lineHeight", "charSpacing"].includes(prop) &&
        newObject.get("type") == "textbox"
      ) {
        if (prop != "lineHeight") {
          // renderProp(prop, object);
        }
        currentObject.defaults.push({ name: prop, value: newObject.get(prop) });
      } else if (prop.startsWith("shadow.")) {
        // SKIPPED FOR NOW -- GEORGE
        if (newObject.get("type") != "group") {
          //   if (prop == "shadow.color") {
          //     renderProp(prop, object);
          //     currentObject.defaults.push({
          //       name: prop,
          //       value: newObject.shadow.color,
          //     });
          //   } else {
          //     currentObject.defaults.push({
          //       name: prop,
          //       value: newObject.shadow[prop.split(".")[1]],
          //     });
          //   }
          // }
        }
      } else {
        currentObject.defaults.push({ name: prop, value: newObject.get(prop) });
      }
    });
  } else {
    // Special handling for audio properties
    // renderProp("volume", object);
    let currentObject = objects.find(
      (x) => x.id == newObject.id
    ) as fabric.Object;
    currentObject.defaults.push({ name: "volume", value: 1 });
  }

  const foundObject = objects.find((x) => x.id == newObject.id);
  if (foundObject) {
    foundObject.animate = (animatable, options) => {
      return {};
    };
  }
  animate(false, currenttime, canvas, objects, p_keyframes, duration);
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
