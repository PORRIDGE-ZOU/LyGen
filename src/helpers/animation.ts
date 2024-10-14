import anime from "animejs";
import { props, allAnimatedTexts, ticker } from "./globals";
import { findCurrentLyrics } from "./lyricsParsing";
import { PKeyframe } from "./types";
import * as fabric from "fabric";
import { playAudio } from "@/app/page";

/** Animate timeline (or seek to specific point in time)
 * IMPROVED BY CHATGPT -- GEORGE
 * @param play
 * @param currenttime
 * @param canvas
 * @param objects
 * @param p_keyframes
 * @param duration
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
  // anime.speed = 1;

  const starttime = new Date();
  const offset = currenttime;
  const inst = canvas;
  if (play) {
    ticker.resume();
  }

  if (!play) {
    updateObjectVisibility(objects, inst, p_keyframes, currenttime, duration);

    // HANDLE ANIMATED TEXT
    renderAnimatedTexts(currenttime, canvas, inst);
    inst.renderAll();
  }

  // handling keyframes
  // keyframes.forEach((keyframe, index) => {
  //   // Function to find the next keyframe in time from the same object & property
  //   function nextKeyframe(keyframe, index) {
  //     const sortedKeyframes = keyframes.slice().sort((a, b) => a.t - b.t);
  //     const remainingKeyframes = sortedKeyframes.slice(
  //       sortedKeyframes.findIndex((x) => x === keyframe) + 1
  //     );

  //     for (const kf of remainingKeyframes) {
  //       if (kf.id === keyframe.id && kf.name === keyframe.name) {
  //         return kf;
  //       }
  //     }

  //     return false;
  //   }

  //   // Regroup if needed
  //   const group = groups.find((x) => x.id === keyframe.id);
  //   if (group) {
  //     const object = canvas.getItemById(keyframe.id);

  //     // Set object visibility based on current time and keyframe properties
  //     const pKeyframe = p_keyframes.find((x) => x.id === keyframe.id);
  //     const isVisible =
  //       currenttime >= pKeyframe.trimstart + pKeyframe.start &&
  //       currenttime <= pKeyframe.end &&
  //       currenttime <= duration;

  //     object.set("visible", isVisible);
  //     inst.renderAll();

  //     if (isVisible) {
  //       props.forEach((prop) => checkAnyKeyframe(keyframe.id, prop, inst));
  //     }
  //   }

  //   // Function to set the value of an object's property
  //   function setValue(prop, object, value, inst) {
  //     if (object.get("assetType") === "audio" && play) {
  //       if (object.get("src")) {
  //         object.get("src").volume = value;
  //         object.set("volume", value);
  //       }
  //       return;
  //     }

  //     if (object.get("type") !== "group") {
  //       if (object.group) {
  //         // Code for handling group properties (commented out for now)
  //       }
  //     }

  //     // Set the property value
  //     if (prop === "left" && !recording) {
  //       object.set(prop, value + artboard.get("left"));
  //     } else if (prop === "top" && !recording) {
  //       object.set(prop, value + artboard.get("top"));
  //     } else if (prop.startsWith("shadow.")) {
  //       const shadowProp = prop.split(".")[1];
  //       object.shadow[shadowProp] = value;
  //     } else if (object.get("type") !== "group" || prop !== "width") {
  //       object.set(prop, value);
  //     }

  //     inst.renderAll();
  //   }

  //   const object = canvas.getItemById(keyframe.id);

  //   // Handle keyframe animation
  //   if (
  //     keyframe.t >= time &&
  //     currenttime >=
  //       p_keyframes.find((x) => x.id === keyframe.id).trimstart +
  //         p_keyframes.find((x) => x.id === keyframe.id).start
  //   ) {
  //     const lastKeyframe = keyframes
  //       .slice(0, index)
  //       .reverse()
  //       .find((kf) => kf.id === keyframe.id && kf.name === keyframe.name);
  //     const lastTime = lastKeyframe ? lastKeyframe.t : 0;
  //     const lastProp = lastKeyframe
  //       ? lastKeyframe.value
  //       : objects
  //           .find((x) => x.id === keyframe.id)
  //           .defaults.find((x) => x.name === keyframe.name).value;

  //     if (lastKeyframe && lastKeyframe.t >= time && !play) return;

  //     const delay = play && lastTime > currenttime ? lastTime - time : 0;

  //     const animation = { value: lastProp };
  //     const instance = anime({
  //       targets: animation,
  //       delay: delay,
  //       value: keyframe.value,
  //       duration: keyframe.t - lastTime,
  //       easing: keyframe.easing,
  //       autoplay: false,
  //       update: () => {
  //         if (start && !paused) {
  //           const pKeyframe = p_keyframes.find((x) => x.id === keyframe.id);
  //           const isVisible =
  //             currenttime >= pKeyframe.trimstart + pKeyframe.start &&
  //             currenttime <= pKeyframe.end &&
  //             currenttime <= duration;

  //           setValue(keyframe.name, object, animation.value, inst);
  //           object.set("visible", isVisible);
  //           inst.renderAll();
  //         } else if (start && paused) {
  //           anime.remove(animation);
  //         }
  //       },
  //       changeBegin: () => {
  //         start = true;
  //       },
  //     });

  //     instance.seek(time - lastTime <= 0 ? 0 : time - lastTime);

  //     if (play) instance.play();
  //     else if (
  //       parseFloat(lastTime) <= parseFloat(time) &&
  //       parseFloat(keyframe.t) >= parseFloat(time)
  //     ) {
  //       setValue(keyframe.name, object, animation.value, inst);
  //     }
  //   } else if (keyframe.t < time && !nextKeyframe(keyframe, index)) {
  //     const prop = keyframe.name;
  //     const currentVal = prop.startsWith("shadow.")
  //       ? object.shadow[prop.split(".")[1]]
  //       : object.get(prop);

  //     if (currentVal !== keyframe.value) {
  //       setValue(keyframe.name, object, keyframe.value, inst);
  //     }
  //   }
  // });

  // Additional code for handling visibility and animations

  // playVideos(time);
  if (play) {
    playAudio(
      currenttime,
      objects,
      canvas!,
      p_keyframes,
      currenttime,
      duration
    );
  }
  inst.renderAll();

  if (play && !ticker.paused) {
    const animation = { value: 0 };
    // initializes a new animation (inside animate())
    const mainInstance = anime({
      targets: animation,
      value: [currenttime, duration],
      duration: duration - currenttime,
      easing: "linear",
      autoplay: true,
      update: () => {
        if (!ticker.paused) {
          currenttime = animation.value;
          if (onTimeChange) {
            onTimeChange(currenttime);
          }
          // NOTE: TODO: Note here that instead of looping over the entire AnimatedText array (which Motionity does), we only loop over the activeLyrics array. This is much more optimized for performance. Maybe there is a better method. -- GEORGE
          renderAnimatedTexts(currenttime, canvas, inst);
          updateObjectVisibility(
            objects,
            inst,
            p_keyframes,
            currenttime,
            duration
          );
          inst.renderAll();
          // if (!recording) {
          //   renderTime();
          //   $("#seekbar").css({
          //     left: currenttime / timelinetime + offset_left,
          //   });
          // }
        } else {
          ticker.setCurrentTime(currenttime);
          animation.value = duration + 1;
          anime.remove(animation);
        }
      },
      complete: () => {
        ticker.pause();
        ticker.setCurrentTime(0);
      },
    });
  } else if (ticker.paused) {
    ticker.setCurrentTime(currenttime);
  }
}

function renderAnimatedTexts(
  currenttime: number,
  canvas: fabric.Canvas,
  inst: fabric.Canvas
) {
  if (allAnimatedTexts.length > 0) {
    let active = findCurrentLyrics(currenttime);
    if (allAnimatedTexts.length > 0) {
      let active = findCurrentLyrics(currenttime);
      active?.forEach((text) => {
        text.seek(currenttime, canvas);
      });
    }
  }
}

function updateObjectVisibility(
  objects: fabric.FabricObject[],
  inst: fabric.Canvas,
  p_keyframes: PKeyframe[],
  currenttime: number,
  duration: number
) {
  objects.forEach((object) => {
    if (!object.id.includes("Group")) {
      const object2 = inst.getItemById(object.id);
      const pKeyframe = p_keyframes.find(
        (x) => x.id === object.id
      ) as PKeyframe;
      const isVisible =
        currenttime >= pKeyframe.trimstart + pKeyframe.start &&
        currenttime <= pKeyframe.end &&
        currenttime <= duration;
      object2?.set("visible", isVisible);
      // inst.renderAll();
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
