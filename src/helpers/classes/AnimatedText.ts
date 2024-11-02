import { animateText, animate } from "../animation";
import {
  globalRegulator,
  allObjects,
  p_keyframes,
  activeLyrics,
} from "../globals";
import { deleteObject, hexToRgb, realignLineOfText, rgbToHex } from "../misc";
import * as fabric from "fabric";
import { FabricObject, FabricText } from "fabric";
import { LerpImportance, renderText, setText } from "../textRendering";
import { AnimationProps } from "../types/index";

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
    // console.log(
    //   "[calcColorFromImp] newR: ",
    //   newR,
    //   "newG: ",
    //   newG,
    //   "newB: ",
    //   newB,
    //   "hex: ",
    //   rgbToHex(newR, newG, newB)
    // );
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

    this.seek(globalRegulator.currentTime, this.canvas!);
  }
}
