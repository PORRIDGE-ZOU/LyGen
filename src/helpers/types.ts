import { FabricObject, FabricText } from "fabric";
import anime from "animejs";
import * as fabric from "fabric";
import {
  activeLyrics,
  allAnimatedTexts,
  allObjects,
  p_keyframes,
  globalRegulator,
} from "./globals";

declare module "fabric" {
  interface Canvas {
    getItemById(name: string): FabricObject | null;
  }

  interface Object {
    object?: FabricObject;
    label?: string;
    color?: string;
    mask?: string;
    id: string;
    defaults: Array<{ name: string; value: any }>;
    defaultLeft?: number;
    defaultTop?: number;
    defaultScaleX?: number;
    defaultScaleY?: number;
    animateDuration?: number;
  }

  interface GroupProps {
    // this is to suppress the error down there -- GEORGE
    id: string;
    cursorWidth: number;
    cursorDuration: number;
    cursorDelay: number;
    assetType: string;
    strokeDashArray: number[];
    inGroup: boolean;
  }
}
// Declare a new type p_keyframes
export type PKeyframe = {
  start: number; // The start time from where you CANNOT trim the object anymore ahead
  end: number; // The end time where you CANNOT trim the object anymore behind
  trimstart: number; // The start time OFFSET from [start] where you can trim the object
  trimend: number; // The end time OFFSET from [end] where you can trim the object
  object: Object;
  id: string;
};

export class LygenObject extends FabricObject {
  object?: FabricObject;
  label?: string;
  color?: string;
  mask?: string;
  id: string;
  defaults: Array<{ name: string; value: any }>;
  locked?: any;
  start?: number;
  end?: number;
  animateDuration?: number;

  constructor(
    id: string,
    object?: FabricObject,
    label?: string,
    color?: string,
    mask?: string,
    defaults?: Array<{ name: string; value: any }>,
    locked?: any,
    start?: number,
    end?: number
  ) {
    super();
    this.id = id;
    this.object = object;
    this.label = label;
    this.color = color;
    this.mask = mask;
    this.defaults = defaults || [];
    this.locked = locked;
    this.start = start;
    this.end = end;
    if (object && object.animateDuration) {
      this.animateDuration = object.animateDuration;
    }
  }
}

export class LyricsLine {
  text = "DEFAULT LINE (Something is wrong)";
  timeString = "00:00.00";
  timeInSeconds = 0;
  enhanced = false;
  isEnhancedSentenceEnd = false;
  enhancedWordEndTime = 0;
  enhancedSentenceEndTime = 0;
  /**
   *
   * @param text
   * @param timeString
   * @param enhanced
   * @param isEnhancedSentenceEnd
   * @param enhancedWordEndString This will be converted to seconds
   * @param enhancedSentenceEndString same as above
   * @returns
   */
  constructor(
    text: string,
    timeString: string,
    enhanced = false,
    isEnhancedSentenceEnd = false,
    enhancedWordEndString = "",
    enhancedSentenceEndString = ""
  ) {
    this.text = text;
    this.timeString = timeString;
    this.timeInSeconds = this.convertTimeToSeconds(timeString);
    this.enhanced = enhanced;
    if (!enhanced) {
      // If the line is not enhanced, we don't need to check for enhanced sentence end
      return;
    }
    this.isEnhancedSentenceEnd = isEnhancedSentenceEnd;
    if (enhancedWordEndString != "") {
      this.enhancedWordEndTime = this.convertTimeToSeconds(
        enhancedWordEndString
      );
    } else {
      this.enhancedWordEndTime = this.timeInSeconds + 5;
    }
    // NOTE: for now, sentence ends with all words. -- GEORGE
    if (enhancedSentenceEndString != "") {
      this.enhancedSentenceEndTime = this.convertTimeToSeconds(
        enhancedSentenceEndString
      );
    } else {
      this.enhancedSentenceEndTime = this.timeInSeconds + 5;
    }
  }
  getText() {
    return this.text;
  }
  getTimeInSeconds() {
    return this.timeInSeconds;
  }
  convertTimeToSeconds(timeString: string) {
    var minutes = parseInt(timeString.split(":")[0]);
    var seconds = parseInt(timeString.split(":")[1].split(".")[0]);
    var milliseconds = parseInt(timeString.split(":")[1].split(".")[1]);
    var result = minutes * 60 + seconds + milliseconds / 100;
    // console.log(
    //   "convert time to seconds: " + result + " for " + this.getText()
    // );
    return minutes * 60 + seconds + milliseconds / 100;
  }
}

import { newLayer } from "@/app/page";
import { deleteObject, realignLineOfText } from "./canvasMisc";
import { animate, animateText } from "./animation";
import { hexToRgb, rgbToHex } from "@/components/ImportanceTab";
// declare function save(): void;

export interface AnimationProps {
  duration: number;
  order: "forward" | "backward";
  typeAnim: string;
  preset: string;
  easing: string;
  fill?: string;
  fontFamily?: string;
  left?: number;
  top?: number;
  defaultScaleX?: number;
  defaultScaleY?: number;
}

function setText(
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

function renderText_LetterWise(
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

function renderText(
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
  console.log("setting animateDuration to: ", result.get("animateDuration"));
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
 * A class for text with letter-wise animations.
 * @param props AnimationProps = {duration: number, order: "forward" | "backward", typeAnim: string, preset: string, easing: string, fill?: string, fontFamily?: string, left?: number, top?: number}
 * where preset should be one of "typewriter", "fade in", "slide top", "slide bottom", "slide left", "slide right", "scale", "shrink"
 * @param id should be unique. You should use the Ticker class.
 */
export class AnimatedText extends FabricObject {
  text: string;
  textFabricObject: FabricText | null = null;
  props: AnimationProps;
  id: string;
  duration: number = 100;
  canvas: fabric.Canvas | undefined = undefined;
  private _importance: number = 0.5; // Private variable for importance
  // Getter and setter for importance
  get importance(): number {
    return this._importance;
  }
  set importance(value: number) {
    this._importance = Math.max(0, Math.min(1, value));
    if (value > 1 || value < 0) {
      console.error(
        "Something went wrong with setting importance. It should be between 0 and 1."
      );
    }
  }

  constructor(
    text: string,
    id: string,
    props: AnimationProps,
    importance?: number
  ) {
    super();
    this.text = text;
    this.props = props;
    this.duration = props.duration;
    this.id = id;
    if (importance) {
      this.importance = importance;
      this.duration = this.calcDurationFromImportance();
    }
  }

  renderAnimatedText(cv: fabric.Canvas, startTime?: number, endTime?: number) {
    let textFabricObject = renderText(
      this.text,
      this.props,
      this.props.left!,
      this.props.top!,
      cv,
      this.id,
      true, //TRUE! because we want to set the start and end time -- GEORGE
      startTime,
      endTime,
      this.duration,
      this.props.defaultScaleX,
      this.props.defaultScaleY
    );
    this.id = textFabricObject.id;
    this.textFabricObject = textFabricObject;
    this.canvas = cv;

    animateText(
      textFabricObject,
      globalRegulator.currentTime,
      false,
      this.props,
      cv,
      this.id,
      this.duration
    );
  }

  seek(ms: number, cv: fabric.Canvas) {
    animateText(
      this.textFabricObject!,
      ms,
      false,
      this.props,
      cv,
      this.id,
      this.duration
    );
  }

  play(cv: fabric.Canvas) {
    animateText(
      this.textFabricObject!,
      0,
      true,
      this.props,
      cv,
      this.id,
      this.duration
    );
  }

  getObject(cv: fabric.Canvas) {
    return cv.getItemById(this.id);
  }

  setProps(newprops: Partial<AnimationProps>, cv: fabric.Canvas) {
    this.props = Object.assign(this.props, newprops);
    setText(cv.getItemById(this.id) as fabric.Group, this.props, cv);
  }

  setProp(newprop: Partial<AnimationProps>) {
    Object.assign(this.props, newprop);
  }

  reset(text: string, newprops: AnimationProps, cv: fabric.Canvas) {
    var obj = cv.getItemById(this.id) as fabric.Group;
    var left = obj.left;
    var top = obj.top;
    var scaleX = obj.scaleX;
    var scaleY = obj.scaleY;
    var angle = obj.angle;
    // var start = p_keyframes.find((x) => x.id == this.id)?.start || 0;
    let startTime = obj.get("starttime");
    let endTime = obj.get("endtime");
    deleteObject(obj, false, cv);
    this.text = text;
    this.props = newprops;
    let obj2 = renderText(
      text,
      this.props,
      left!,
      top!,
      cv,
      this.id,
      true,
      startTime,
      endTime,
      this.duration,
      this.props.defaultScaleX,
      this.props.defaultScaleY
    );
    this.id = obj2.id;
    this.textFabricObject = obj2;
    cv.getItemById(this.id)!.set({
      angle: angle,
      scaleX: scaleX,
      scaleY: scaleY,
    });
    cv.renderAll();
    animateText(
      this.textFabricObject!,
      globalRegulator.currentTime,
      false,
      this.props,
      cv,
      this.id,
      this.duration
    );
    animate(false, globalRegulator.currentTime, cv, allObjects, p_keyframes, 0);
  }

  setImportance(importance: number) {
    this.importance = importance;

    // update duration
    this.duration = this.calcDurationFromImportance();
    this.textFabricObject?.set({
      animateDuration: this.duration,
    });

    // update scale
    let scaleFactor = globalRegulator.impEnlargeFactor;
    // lerp from 1 to 1 * scaleFactor
    let lerpscale = LerpImportance(1, scaleFactor, importance);
    this.props.defaultScaleX = lerpscale;
    this.props.defaultScaleY = lerpscale;

    // update color
    let newColor = this.calcColorFromImportance();
    this.props.fill = newColor;
    this.textFabricObject?.set({
      fill: newColor,
    });

    let endtime = this.textFabricObject?.get("endtime");
    let texts = activeLyrics.get(endtime);
    if (!texts) {
      console.log("Texts not found in activeLyrics map.");
      return;
    }
    realignLineOfText(texts, this.canvas!);
  }

  calcDurationFromImportance() {
    let scaleFactor = globalRegulator.impAnimSlowFactor;
    let lerpscale = LerpImportance(500, scaleFactor, this.importance);
    return lerpscale;
  }

  /**
   * @NOTE only works if importance >= 0.5 for now! -- GEORGE
   */
  calcColorFromImportance() {
    let RGB = globalRegulator.impRGBColor;
    let currentFill = this.props.fill!;
    const { r, g, b } = hexToRgb(currentFill);

    // Calculate the new color
    if (this.importance < 0.5) {
      return currentFill;
    }
    function lerp(a: number, b: number, t: number): number {
      return a + (b - a) * t;
    }

    function clamp(value: number): number {
      return Math.round(Math.max(0, Math.min(255, value)));
    }
    let t = (this.importance - 0.5) / 0.5;
    let newR = lerp(r, RGB[0], t);
    let newG = lerp(g, RGB[1], t);
    let newB = lerp(b, RGB[2], t);

    newR = clamp(newR);
    newG = clamp(newG);
    newB = clamp(newB);
    console.log(
      "[calcColorFromImp] newR: ",
      newR,
      "newG: ",
      newG,
      "newB: ",
      newB,
      "hex: ",
      rgbToHex(newR, newG, newB)
    );
    return rgbToHex(newR, newG, newB);
  }

  refresh() {
    // refresh scale
    let scaleFactor = globalRegulator.impEnlargeFactor;
    let lerpscale = LerpImportance(1, scaleFactor, this.importance);
    this.props.defaultScaleX = lerpscale;
    this.props.defaultScaleY = lerpscale;

    // refresh duration
    this.duration = this.calcDurationFromImportance();
    this.textFabricObject?.set({
      animateDuration: this.duration,
    });

    // refresh color
    let newColor = this.calcColorFromImportance();
    this.props.fill = newColor;
    this.textFabricObject?.set({
      fill: newColor,
    });

    let endtime = this.textFabricObject?.get("endtime");
    let texts = activeLyrics.get(endtime);
    if (!texts) {
      console.log(
        "[AnimatedText::refresh()] Texts not found in activeLyrics map."
      );
      return;
    }
    realignLineOfText(texts, this.canvas!);
  }
}

export function addAnimatedText(
  text: string,
  id: string,
  x: number,
  y: number,
  canvas: fabric.Canvas,
  startTime?: number,
  endTime?: number
) {
  var newtext = new AnimatedText(text, id, {
    left: x,
    top: y,
    preset: "shrink", // TODO: This is the animation for now -- GEORGE
    typeAnim: "word",
    order: "forward",
    fontFamily: globalRegulator.defaultFont,
    duration: 500, // TODO: THIS IS THE DURATION FOR ANIMATION -- GEORGE
    easing: "easeInQuad",
    fill: "#FFFFFF",
    defaultScaleX: 1,
    defaultScaleY: 1,
  });
  allAnimatedTexts.push(newtext);
  newtext.renderAnimatedText(canvas, startTime, endTime);
  return newtext;
}

/**
 * If importance >= 0.5,
 * Lerp from original to (original * scale) by (importance - 0.5).
 * If importance < 0.5,
 * Lerp from original to (original * 1/scale) by (0.5 - importance).
 * @NOTE importance should be between 0 and 1.
 * @returns the lerped value.
 */
function LerpImportance(original: number, scale: number, importance: number) {
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
