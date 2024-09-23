import { FabricObject, FabricText } from "fabric";
import anime from "animejs";
import * as fabric from "fabric";
import { allObjects, p_keyframes } from "./globals";
import { Fab } from "@mui/material";

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
      // console.log(
      //   "enhancedWordEndString is empty. Set to " + this.enhancedWordEndTime
      // );
    }
    if (enhancedSentenceEndString != "") {
      this.enhancedSentenceEndTime = this.convertTimeToSeconds(
        enhancedSentenceEndString
      );
    } else {
      this.enhancedSentenceEndTime = this.timeInSeconds + 5;
      // console.log(
      //   "enhancedSentenceEndString is empty. Set to " +
      //     this.enhancedSentenceEndTime
      // );
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

// Assuming these are defined elsewhere in your codebase
declare var currenttime: number;
declare var artboard: { left: number; top: number };
declare var layer_count: number;

// Utility functions assumed to exist
declare function newLayer(
  newObject: FabricObject,
  objects: FabricObject[],
  p_keyframes: PKeyframe[],
  canvas: fabric.Canvas,
  duration: number,
  currenttime: number
): void;
declare function deleteObject(
  obj: FabricObject,
  flag: boolean,
  canvas: fabric.Canvas
): void;
declare function animate(
  play: boolean,
  currenttime: number,
  canvas: fabric.Canvas,
  objects: fabric.Object[],
  p_keyframes: PKeyframe[],
  duration: number,
  onTimeChange?: (time: number) => void
): void;
// declare function save(): void;

interface AnimationProps {
  duration: number;
  order: "forward" | "backward";
  typeAnim: string;
  preset: string;
  easing: string;
  fill?: string;
  fontFamily?: string;
  left?: number;
  top?: number;
}

function animateText(
  group: fabric.Group,
  ms: number,
  play: boolean,
  props: AnimationProps,
  cv: fabric.Canvas,
  id: string
) {
  var starttime = p_keyframes.find((x) => x.id == id)?.start || 0;
  ms -= starttime;
  var length = group._objects.length;
  var globaldelay = 0;

  for (var i = 0; i < length; i++) {
    var index = i;
    if (props.order == "backward") {
      index = length - i - 1;
    }
    let item = group.item(index) as any;
    let left = item.defaultLeft;
    let top = item.defaultTop;
    let scaleX = item.defaultScaleX;
    let scaleY = item.defaultScaleY;
    var duration = props.duration / length;
    var delay = i * duration;
    var animation = {
      opacity: 0,
      top: top,
      left: left,
      scaleX: scaleX,
      scaleY: scaleY,
    };
    if (props.typeAnim == "letter") {
      delay = i * duration - 100;
    } else if (props.typeAnim == "word") {
      if (item.text == " ") {
        globaldelay += 500;
      }
      delay = globaldelay;
    }
    if (props.preset == "typewriter") {
      delay = i * duration;
      duration = 20;
    } else if (props.preset == "fade in") {
      // Do nothing
    } else if (props.preset == "slide top") {
      animation.top += 20;
    } else if (props.preset == "slide bottom") {
      animation.top -= 20;
    } else if (props.preset == "slide left") {
      animation.left += 20;
    } else if (props.preset == "slide right") {
      animation.left -= 20;
    } else if (props.preset == "scale") {
      animation.scaleX = 0;
      animation.scaleY = 0;
    } else if (props.preset == "shrink") {
      animation.scaleX = 1.5;
      animation.scaleY = 1.5;
    }
    if (delay < 0) {
      delay = 0;
    }
    if (duration < 20) {
      duration = 20;
    }
    var start = false;
    var instance = anime({
      targets: animation,
      delay: delay,
      opacity: 1,
      left: left,
      top: top,
      scaleX: scaleX,
      scaleY: scaleY,
      duration: duration,
      easing: props.easing,
      autoplay: play,
      update: function () {
        if (start && play) {
          item.set({
            opacity: animation.opacity,
            left: animation.left,
            top: animation.top,
            scaleX: animation.scaleX,
            scaleY: animation.scaleY,
          });
          cv.renderAll();
        }
      },
      changeBegin: function () {
        start = true;
      },
    });
    instance.seek(ms);
    if (!play) {
      item.set({
        opacity: animation.opacity,
        left: animation.left,
        top: animation.top,
        scaleX: animation.scaleX,
        scaleY: animation.scaleY,
      });
      cv.renderAll();
    }
  }
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

function renderText(
  string: string,
  props: AnimationProps,
  x: number,
  y: number,
  cv: fabric.Canvas,
  id: string,
  isnew: boolean,
  start: number,
  startTime?: number,
  endTime?: number
): string {
  var textOffset = 0;
  var groupItems: fabric.Object[] = [];

  function renderLetter(letter: string): fabric.Text {
    var text = new FabricText(letter, {
      left: textOffset,
      top: 0,
      fill: props.fill,
      fontFamily: props.fontFamily,
      opacity: 1,
    }) as any;
    text.set({
      defaultLeft: text.left,
      defaultTop: text.top,
      defaultScaleX: 1,
      defaultScaleY: 1,
    });
    if (startTime && endTime) {
      text.set("notnew", true);
      text.set("starttime", startTime);
      text.set("endtime", endTime);
    }
    textOffset += text.get("width");
    return text;
  }

  for (var i = 0; i < string.length; i++) {
    groupItems.push(renderLetter(string.charAt(i)));
  }

  var result = new fabric.Group(groupItems, {
    stroke: "#000",
    strokeUniform: true,
    paintFirst: "stroke",
    strokeWidth: 0,
    originX: "center",
    originY: "center",
    left: x - artboard.left,
    top: y - artboard.top,
    cursorWidth: 1,
    cursorDuration: 1,
    cursorDelay: 250,
    assetType: "animatedText",
    id: id,
    strokeDashArray: [],
    inGroup: false,
  }) as any;

  if (isnew) {
    result.set({
      notnew: true,
      starttime: start,
    });
  }
  result.objectCaching = false;
  cv.add(result);
  cv.renderAll();
  newLayer(result, allObjects, p_keyframes, cv, props.duration, currenttime);

  result._objects.forEach(function (object: any, index: number) {
    result.item(index).set({
      defaultLeft: result.item(index).defaultLeft - result.width / 2,
      defaultTop: result.item(index).defaultTop - result.height / 2,
    });
  });

  cv.setActiveObject(result);
  cv.bringObjectToFront(result);
  return result.id;
}

export class AnimatedText extends FabricObject {
  text: string;
  props: AnimationProps;
  id: string;
  inst?: string;

  constructor(text: string, props: AnimationProps) {
    super();
    this.text = text;
    this.props = props;
    this.id = "Text" + layer_count;
  }

  // NOTE: I changed the name of the function to renderAnimatedText!! -- GEORGE
  renderAnimatedText(cv: fabric.Canvas, startTime?: number, endTime?: number) {
    this.id = renderText(
      this.text,
      this.props,
      this.props.left!,
      this.props.top!,
      cv,
      this.id,
      false,
      0,
      startTime,
      endTime
    );
    animateText(
      cv.getItemById(this.id) as fabric.Group,
      currenttime,
      false,
      this.props,
      cv,
      this.id
    );
  }

  seek(ms: number, cv: fabric.Canvas) {
    animateText(
      cv.getItemById(this.id) as fabric.Group,
      ms,
      false,
      this.props,
      cv,
      this.id
    );
  }

  play(cv: fabric.Canvas) {
    animateText(
      cv.getItemById(this.id) as fabric.Group,
      0,
      true,
      this.props,
      cv,
      this.id
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
    var start = p_keyframes.find((x) => x.id == this.id)?.start || 0;
    deleteObject(obj, false, cv);
    this.text = text;
    this.props = newprops;
    this.inst = renderText(
      text,
      this.props,
      left!,
      top!,
      cv,
      this.id,
      true,
      start
    );
    cv.getItemById(this.id)!.set({
      angle: angle,
      scaleX: scaleX,
      scaleY: scaleY,
    });
    cv.renderAll();
    animateText(
      cv.getItemById(this.id) as fabric.Group,
      currenttime,
      false,
      this.props,
      cv,
      this.id
    );
    animate(false, currenttime, cv, allObjects, p_keyframes, 0);
    // save();
  }

  assignTo(id: string, text: string, props: AnimationProps) {
    this.id = id;
  }
}
