import { AnimatedText } from "./classes/AnimatedText";
import { allAnimatedTexts, globalRegulator } from "./globals";
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
  var newtext = new AnimatedText(text, id, {
    left: x,
    top: y,
    preset: "shrink", // TODO: This is the animation for now -- GEORGE
    typeAnim: "word",
    order: "forward",
    fontFamily: globalRegulator.defaultFont,
    duration: 500, // TODO: THIS IS THE DURATION FOR ANIMATION -- GEORGE
    easing: "easeInQuad",
    fill: "#ffffff",
    defaultScaleX: 1,
    defaultScaleY: 1,
  });
  allAnimatedTexts.push(newtext);
  newtext.renderAnimatedText(canvas, startTime, endTime);
  return newtext;
}
