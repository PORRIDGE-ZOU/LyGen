import { animateText, animate } from "../animation";
import {
  globalRegulator,
  AllObjects,
  P_Keyframes,
  AllLyrics,
} from "../globals";
import { deleteObject, hexToRgb, realignLineOfText, rgbToHex } from "../misc";
import * as fabric from "fabric";
import { FabricObject, FabricText } from "fabric";
import { LerpImportance, renderText, setText } from "../textRendering";
import { AnimationProps } from "../types/index";
import {
  ColorChangeCutpoint,
  CustomInstrument,
  InstrumentSettings,
} from "@/components/LyricalInstrumentTab";

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
    if (isNaN(value)) {
      console.error(
        `Invalid importance value (NaN) for text: ${this.text}. Setting default importance to 0.5.`
      );
      value = 0.5; // Default importance
    }
    this._importance = Math.max(0, Math.min(1, value));
  }
  instrument: string = "";
  customInstrument?: CustomInstrument;

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
    } else {
      this.importance = 0.5;
      console.warn(
        "Importance not set for AnimatedText. Defaulting to 0.5. text: ",
        text
      );
    }
    console.log(`Creating AnimatedText with fill: ${props.fill}, id: ${id}`);
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
      this.props.scaleX,
      this.props.scaleY
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
      this.props.scaleX,
      this.props.scaleY
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
    animate(false, globalRegulator.currentTime, cv, AllObjects, P_Keyframes, 0);
  }

  /** Apply Importance, THEN REFRESH. */
  applyImportance(importance: number) {
    this.importance = importance;
    this.refresh();
    // // update duration
    // this.duration = this.calcDurationFromImportance();
    // this.textFabricObject?.set({
    //   animateDuration: this.duration,
    // });

    // // update scale
    // let scaleFactor = globalRegulator.impEnlargeFactor;
    // // lerp from 1 to 1 * scaleFactor
    // let lerpscale = LerpImportance(1, scaleFactor, importance);
    // this.props.scaleX = lerpscale;
    // this.props.scaleY = lerpscale;

    // // update color
    // let newColor = this.calcColorFromImportance();
    // this.props.fill = newColor;
    // this.textFabricObject?.set({
    //   fill: newColor,
    // });

    // let endtime = this.textFabricObject?.get("endtime");
    // let texts = AllLyrics.get(endtime);
    // if (!texts) {
    //   console.log("Texts not found in activeLyrics map.");
    //   return;
    // }
    // realignLineOfText(texts, this.canvas!);
  }

  /** Set Instrument, THEN REFRESH. */
  applyInstrument(instrument: string, custom?: CustomInstrument) {
    this.instrument = instrument;
    if (custom) {
      this.customInstrument = custom;
    }
    this.refresh();
  }

  calcDurationFromImportance() {
    let scaleFactor = globalRegulator.impAnimSlowFactor;
    let lerpscale = LerpImportance(
      globalRegulator.defaultAnimDuration,
      scaleFactor,
      this.importance
    );
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
    if (this.importance <= 0.5) {
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
      `Calculating color with currentFill: ${currentFill}, importance: ${this.importance}`
    );
    if (Number.isNaN(this.importance)) {
      console.log("Text: ", this.text, " has NaN importance.");
    }
    return rgbToHex(newR, newG, newB);
  }

  refresh() {
    let scaleFactor = 1;
    let duration = this.props.duration;
    let newColor = this.props.fill;
    let shouldBold = false;
    if (this.instrument === "") {
    } else if (this.instrument === "sizeScaling") {
      scaleFactor = globalRegulator.impEnlargeFactor;
      scaleFactor = LerpImportance(1, scaleFactor, this.importance);
    } else if (this.instrument === "boldThreshold") {
      if (this.importance >= globalRegulator.impBoldThreshold) {
        shouldBold = true;
      }
    } else if (this.instrument === "animationSpeedScaling") {
      duration = this.calcDurationFromImportance();
    } else if (this.instrument === "colorChange") {
      // TODO: Implement color change
      let cutpoints = globalRegulator.impColorChange || [];
      cutpoints = cutpoints.sort((a, b) => a.threshold - b.threshold);
      for (let i = cutpoints.length - 1; i >= 0; i--) {
        if (this.importance >= cutpoints[i].threshold) {
          newColor = cutpoints[i].color;
          break;
        }
      }
    } else if (
      this.customInstrument &&
      this.instrument == this.customInstrument.name
    ) {
      this.customInstrument.functions.forEach((func) => {
        if (func.type === "sizeScaling") {
          scaleFactor = func.value;
          scaleFactor = LerpImportance(1, scaleFactor, this.importance);
        } else if (func.type === "boldThreshold") {
          if (this.importance >= func.value) {
            shouldBold = true;
          }
        } else if (func.type === "animationSpeedScaling") {
          duration = LerpImportance(
            globalRegulator.defaultAnimDuration,
            func.value,
            this.importance
          );
        } else if (func.type === "colorChange") {
          // HODO: Implement color change
          let cutpoints = func.value as ColorChangeCutpoint[];
          cutpoints = cutpoints.sort((a, b) => a.threshold - b.threshold);
          for (let i = cutpoints.length - 1; i >= 0; i--) {
            if (this.importance >= cutpoints[i].threshold) {
              newColor = cutpoints[i].color;
              break;
            }
          }
        }
      });
    }

    // No matter what, reset all the properties
    this.props.scaleX = scaleFactor;
    this.props.scaleY = scaleFactor;
    this.duration = duration;
    this.textFabricObject?.set({
      animateDuration: duration,
    });
    this.textFabricObject!.fontWeight = shouldBold ? "bold" : "normal";
    this.props.fill = newColor;
    this.textFabricObject?.set({
      fill: newColor,
    });

    // realign and seek to rerender
    let endtime = this.textFabricObject?.get("endtime");
    let texts = AllLyrics.get(endtime);
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
