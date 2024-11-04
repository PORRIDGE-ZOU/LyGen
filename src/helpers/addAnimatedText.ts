import { AnimatedText } from "./classes/AnimatedText";
import { AllAnimatedTexts, globalRegulator } from "./globals";
import * as fabric from "fabric";

export function addAnimatedText(
  text: string,
  id: string,
  x: number,
  y: number,
  canvas: fabric.Canvas,
  startTime?: number,
  endTime?: number
) {
  var newtext = new AnimatedText(
    text,
    id,
    {
      left: x,
      top: y,
      preset: "shrink", // TODO: This is the animation for now -- GEORGE
      typeAnim: "word",
      order: "forward",
      fontFamily: globalRegulator.defaultFont,
      duration: globalRegulator.defaultAnimDuration,
      easing: "easeInQuad",
      fill: "#ffffff",
      scaleX: 1,
      scaleY: 1,
    },
    0.5 // This is the importance -- GEORGE
  );
  AllAnimatedTexts.push(newtext);
  newtext.renderAnimatedText(canvas, startTime, endTime);
  return newtext;
}
