import anime from "animejs";
import {
  props,
  allAnimatedTexts,
  globalRegulator,
  p_keyframes,
  activeLyrics,
} from "./globals";
import { findCurrentAndNextLyrics } from "./lyricsParsing";
import { AnimationProps, LygenObject, PKeyframe } from "./types";
import * as fabric from "fabric";
import { playAudio } from "@/app/page";
import { FabricText } from "fabric";

/** Animate timeline (or seek to specific point in time)
 * IMPROVED BY CHATGPT -- GEORGE
 * @param play
 * @param currenttime
 * @param canvas
 * @param objects
 * @param p_keyframes
 * @param duration - total duration of the video
 * @param onTimeChange
 */
export async function animate(
  play: boolean,
  currenttime: number,
  canvas: fabric.Canvas,
  objects: fabric.Object[],
  p_keyframes: PKeyframe[],
  duration: number,
  onTimeChange?: (time: number) => void
) {
  if (!play) {
    updateObjectVisibility(objects, canvas, p_keyframes, currenttime, duration);

    // HANDLE ANIMATED TEXT
    updateAnimatedTexts(currenttime, canvas, canvas);
    canvas.renderAll();
  }
  if (play) {
    globalRegulator.resume();
    playAudio(
      currenttime,
      objects,
      canvas!,
      p_keyframes,
      currenttime,
      duration
    );
    const animation = { value: 0 };
    // initializes a new animation (inside animate())
    const mainInstance = anime({
      targets: animation,
      value: [currenttime, duration],
      duration: duration - currenttime,
      easing: "linear",
      autoplay: true,
      update: () => {
        if (!globalRegulator.paused) {
          currenttime = animation.value;
          if (onTimeChange) {
            onTimeChange(currenttime);
          }
          // NOTE: TODO: Note here that instead of looping over the entire AnimatedText array (which Motionity does), we only loop over the activeLyrics array. This is much more optimized for performance. Maybe there is a better method. -- GEORGE

          updateObjectVisibility(
            objects,
            canvas,
            p_keyframes,
            currenttime,
            duration
          );
          updateAnimatedTexts(currenttime, canvas, canvas);
          canvas.renderAll();
        } else {
          globalRegulator.setCurrentTime(currenttime);
          animation.value = duration + 1;
          anime.remove(animation);
        }
      },
      complete: () => {
        globalRegulator.pause();
        globalRegulator.setCurrentTime(0);
      },
    });
  }
}

function updateAnimatedTexts(
  currenttime: number,
  canvas: fabric.Canvas,
  inst: fabric.Canvas,
  offset?: number
) {
  if (allAnimatedTexts.length > 0) {
    if (offset) {
      currenttime -= offset;
    }
    // TODO: Why is this find current AND NEXT? It's because now due to animation offset, all
    // lyrics should appear slightly before the actual time. So we need to find the current and next lyrics.
    // This might not be the optimal and right solution. -- GEORGE
    // let active = findCurrentAndNextLyrics(currenttime);
    // active?.forEach((text) => {
    //   text.seek(currenttime, canvas);
    // });
    let values = activeLyrics.values();
    for (let i = 0; i < activeLyrics.size; i++) {
      let active = values.next().value;
      active?.forEach((text) => {
        text.seek(currenttime, inst);
      });
    }
  }
}

function updateObjectVisibility(
  objects: fabric.FabricObject[],
  inst: fabric.Canvas,
  p_keyframes: PKeyframe[],
  currenttime: number,
  duration: number // this duration is the total duration of the video
) {
  objects.forEach((object) => {
    if (!object.id.includes("Group")) {
      const object2 = inst.getItemById(object.id);
      const pKeyframe = p_keyframes.find(
        (x) => x.id === object.id
      ) as PKeyframe;
      let isVisible =
        currenttime >= pKeyframe.start &&
        currenttime <= pKeyframe.end &&
        currenttime <= duration;
      if (object.id.includes("AnimText")) {
        let obj = object as LygenObject;
        let activeDuration = obj.animateDuration;
        let start = obj.start!;
        let end = obj.end!;
        if (activeDuration) {
          isVisible =
            currenttime >= start - activeDuration &&
            currenttime <= end - activeDuration &&
            currenttime <= duration;
        } else {
          console.log(
            "[updateObjectVisibility] activeDuration is undefined. Something went wrong."
          );
        }
      }
      object2?.set("visible", isVisible);
      if (isVisible) {
        props.forEach((prop) =>
          checkAnyKeyframe(object.id, prop, inst, objects)
        );
      }
    }
  });
}

// Check whether any keyframe exists for a certain property
function checkAnyKeyframe(
  id: string,
  prop: string,
  inst: fabric.Canvas,
  activeObjects: fabric.Object[]
) {
  const object = inst.getItemById(id);
  if (!object) {
    console.log("[checkAnyKeyframe] object not found");
    return;
  }
  if (object.get("assetType") == "audio") {
    return false;
  }
  if (
    object.get("type") != "textbox" &&
    (prop == "charSpacing" || prop == "lineHeight")
  ) {
    return false;
  }
  if (
    object.get("type") == "group" &&
    (prop == "shadow.opacity" ||
      prop == "shadow.color" ||
      prop == "shadow.offsetX" ||
      prop == "shadow.offsetY" ||
      prop == "shadow.blur")
  ) {
    return false;
  }
  // const keyarr2 = $.grep(keyframes, function (e) {
  //   return e.id == id && e.name == prop;
  // });
  const keyarr2 = []; // [] FOR NOW -- GEORGE
  if (keyarr2.length == 0) {
    // console.log("[checkAnyKeyframe] prop is: " + prop);
    const findObject = activeObjects.find(
      (x) => x.id.toString() === id.toString()
    ) as fabric.Object;
    if (!findObject.defaults) {
      console.log("[checkAnyKeyframe] findObject.defaults is undefined");
    } else {
      // console.log(
      //   "[checkAnyKeyframe] findObject.defaults is defined: ",
      //   findObject.defaults
      // );
    }
    const value = findObject.defaults.find((x) => x.name == prop)?.value;

    if (prop == "left" || prop == "top") {
      // console.log("[checkAnyKeyframe] displaying left and top props, so that you know it's trying to change it to some weird positions.\nobject: ", object, "\nprop: ", prop, "\nobject prop value: ", object.get(prop), "\ntrying to change to value: ", value);
    } else {
      setObjectValue(prop, object, value, inst);
    }
  }
}

// Set object value (while animating)
function setObjectValue(
  prop: string,
  object: fabric.Object,
  value: any,
  inst: fabric.Canvas
) {
  if (object.get("type") != "group") {
    // if (object.group) {
    //   var group = object.group;
    //   tempgroup = group._objects;
    //   group._restoreObjectsState();
    //   canvas.setActiveObject(group);
    //   inst.remove(canvas.getActiveObject());
    //   canvas.discardActiveObject();
    //   inst.renderAll();
    //   for (var i = 0; i < tempgroup.length; i++) {
    //     inst.add(tempgroup[i]);
    //   }
    // }
  }
  // VERY CONFUSING TWO LINES. THIS IS TRIGGERING THE BUG. --GEORGE
  // if (prop == "left" && !recording) {
  //   object.set(prop, value + artboard.get("left"));
  // } else if (prop == "top" && !recording) {
  //   object.set(prop, value + artboard.get("top"));
  // }
  // lines below are fine. --GEORGE
  else if (prop == "shadow.blur") {
    object.shadow!.blur = value;
  } else if (prop == "shadow.color") {
    object.shadow!.color = value;
  } else if (prop == "shadow.offsetX") {
    object.shadow!.offsetX = value;
  } else if (prop == "shadow.offsetY") {
    object.shadow!.offsetY = value;
  } else if (prop == "shadow.blur") {
    object.shadow!.blur = value;
  } else if (object.get("type") != "group") {
    object.set(prop, value);
  } else if (prop != "width") {
    object.set(prop, value);
  }
  inst.renderAll();
}

export function animateTextOld(
  group: fabric.Group,
  currentTime: number,
  play: boolean,
  props: AnimationProps,
  cv: fabric.Canvas,
  id: string,
  animationDuration?: number
) {
  // this should be the actual starting time of this animated text
  var starttime = p_keyframes.find((x) => x.id == id)?.start || 0;
  // this should be the actual ending time of this animated text
  // let endtime = p_keyframes.find((x) => x.id == id)?.end || 0;
  // currentTime -= starttime;
  var length = group._objects.length;
  var globaldelay = 0;

  for (var i = 0; i < length; i++) {
    var index = i;
    if (props.order == "backward") {
      index = length - i - 1;
    }
    // each item should be a letter (fabric.Text)
    let item = group.item(index) as fabric.FabricText;
    let left = item.defaultLeft!;
    let top = item.defaultTop!;
    let scaleX = props.defaultScaleX
      ? props.defaultScaleX
      : item.defaultScaleX!;
    let scaleY = props.defaultScaleY
      ? props.defaultScaleY
      : item.defaultScaleY!;
    var duration = animationDuration
      ? animationDuration
      : props.duration / length;
    // let starttime = endtime - duration;
    let relativeTime = currentTime - starttime;
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
      animation.scaleX = 3;
      animation.scaleY = 3;
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
    instance.seek(relativeTime);
    if (!play) {
      item.set({
        opacity: animation.opacity,
        left: animation.left,
        top: animation.top,
        scaleX: animation.scaleX,
        scaleY: animation.scaleY,
      });
    }
  }
}

export function animateText(
  text: FabricText,
  currentTime: number,
  play: boolean,
  props: AnimationProps,
  cv: fabric.Canvas,
  id: string,
  animationDuration?: number // not used for now
) {
  // this should be the actual starting time of this animated text
  // var starttime = p_keyframes.find((x) => x.id == id)?.start || 0;
  var starttime = text.get("starttime") || 0;
  // this should be the actual ending time of this animated text
  // let endtime = p_keyframes.find((x) => x.id == id)?.end || 0;
  // currentTime -= starttime;
  // each item should be a letter (fabric.Text)
  let item = text;
  let left = item.defaultLeft!;
  let top = item.defaultTop!;
  let scaleX = props.defaultScaleX ? props.defaultScaleX : item.defaultScaleX!;
  let scaleY = props.defaultScaleY ? props.defaultScaleY : item.defaultScaleY!;
  var duration = animationDuration ? animationDuration : props.duration;
  // let starttime = endtime - duration;
  let relativeTime = currentTime - (starttime - duration);
  var animation = {
    opacity: 0,
    top: top,
    left: left,
    scaleX: scaleX,
    scaleY: scaleY,
  };
  if (props.typeAnim == "letter") {
    console.error("[animateText] Letter animation not supported yet.");
  } else if (props.typeAnim == "word") {
  }
  if (props.preset == "typewriter") {
  } else if (props.preset == "fade in") {
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
    animation.scaleX = 3;
    animation.scaleY = 3;
  }
  if (duration < 20) {
    duration = 20;
  }
  var start = false;
  var instance = anime({
    targets: animation,
    delay: 0,
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
  instance.seek(relativeTime);
  if (!play) {
    item.set({
      opacity: animation.opacity,
      left: animation.left,
      top: animation.top,
      scaleX: animation.scaleX,
      scaleY: animation.scaleY,
    });
  }
}
