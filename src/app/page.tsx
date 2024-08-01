"use client"; // next.js app router

import React, { useState, useEffect } from "react";
import * as fabric from "fabric";
import { FabricObject, Canvas } from "fabric";
import { Box, Button, Container, Typography } from "@mui/material";
import anime from "animejs/lib/anime.es.js";

declare module "fabric" {
  interface Canvas {
    getItemById(name: string): fabric.Object | null;
  }

  interface Object {
    id: string;
    defaults: Array<{ name: string; value: any }>;
  }
}
// Declare a new type p_keyframes
type PKeyframe = {
  start: number; // The start time from where you CANNOT trim the object anymore ahead
  end: number; // The end time where you CANNOT trim the object anymore behind
  trimstart: number; // The start time OFFSET from [start] where you can trim the object
  trimend: number; // The end time OFFSET from [end] where you can trim the object
  object: Object;
  id: string;
};
/**
 * All the possible properties of an object
 * @type {string[]}
 */
var props = [
  "left",
  "top",
  "scaleX",
  "scaleY",
  "width",
  "height",
  "angle",
  "opacity",
  "fill",
  "strokeWidth",
  "stroke",
  "shadow.color",
  "shadow.opacity",
  "shadow.offsetX",
  "shadow.offsetY",
  "shadow.blur",
  "charSpacing",
  "lineHeight",
];
/**
 * p_keyframes is an array of default keyframes (generated by the system).
 * @note [start, end] is the range on which you can trim the object.
 * [trimstart, trimend] is the range on which the object actually animates.
 * @type {Array<{
 *   start: number, // The start time from where you CANNOT trim the object anymore ahead
 *   end: number,   // The end time where you CANNOT trim the object anymore behind
 *   trimstart: number,  // The start time OFFSET from [start] where you can trim the object
 *   trimend: number,   // The end time OFFSET from [end] where you can trim the object
 *   object: Object,
 *   id: string
 * }>}
 */
const p_keyframes: PKeyframe[] = [];
const allObjects: fabric.Object[] = [];
let paused = false;

const App = () => {
  const [canvas, setCanvas] = useState<fabric.Canvas>();

  useEffect(() => {
    const canvas = new fabric.Canvas("canvas", {
      height: 540,
      width: 960,
      backgroundColor: "black",
    });

    // settings for all canvas in the app
    FabricObject.prototype.transparentCorners = false;
    FabricObject.prototype.cornerColor = "#2BEBC8";
    FabricObject.prototype.cornerStyle = "rect";
    FabricObject.prototype.cornerStrokeColor = "#2BEBC8";
    FabricObject.prototype.cornerSize = 6;
    canvas.selectionColor = "rgba(46, 115, 252, 0.11)";
    canvas.selectionBorderColor = "rgba(98, 155, 255, 0.81)";
    canvas.selectionLineWidth = 1.5;
    // Get any object by ID
    Canvas.prototype.getItemById = function (name) {
      var object = null,
        objects = this.getObjects();
      for (var i = 0, len = this.size(); i < len; i++) {
        if (objects[i].get("type") == "group") {
          if (objects[i].get("id") && objects[i].get("id") === name) {
            object = objects[i];
            break;
          }
          var wip = i;
          for (var o = 0; o < objects[i]._objects.length; o++) {
            if (
              objects[wip]._objects[o].id &&
              objects[wip]._objects[o].id === name
            ) {
              object = objects[wip]._objects[o];
              break;
            }
          }
        } else if (objects[i].id && objects[i].id === name) {
          object = objects[i];
          break;
        }
      }
      return object;
    };

    canvas.renderAll();
    setCanvas(canvas);
    console.log("[App] canvas created and set");

    return () => {
      console.log("[App] canvas cleaning up");
      canvas.dispose();
    };
  }, []);

  return (
    <Container
      disableGutters={true}
      maxWidth={false}
      style={{ width: "100vw", height: "100vh" }}
    >
      <Box display="flex" flexDirection="row" width="100%" height="60%">
        <Box width="25%">
          <Button onClick={() => addRect(canvas)}>New Rectangle</Button>
          <Button
            onClick={() =>
              newTextbox(
                30,
                700,
                "Hello World",
                960,
                540,
                200,
                true,
                "Inter",
                canvas
              )
            }
          >
            New Text Box
          </Button>
          <Button
            onClick={() => {
              paused = false;
              animate(true, 0, canvas!, allObjects, p_keyframes, 10000);
            }}
          >
            Play
          </Button>
        </Box>
        <Box width="100%">
          <canvas id="canvas" />
        </Box>
        <Box width="25%">
          <Typography variant="h6">Right Column</Typography>
        </Box>
      </Box>
    </Container>
  );
};

const addRect = (canvas?: fabric.Canvas) => {
  const rect = new fabric.Rect({
    height: 280,
    width: 200,
    stroke: "#2BEBC8",
  });
  canvas?.add(rect);
  canvas?.requestRenderAll();
};

/**
 * Creates a new fabric.Textbox object and adds it to the canvas.
 * Triggers when you use the "text" section.
 * @param {string} text - The content of the text.
 * @param {number} x - The x-coordinate of the text.
 * @param {number} y - The y-coordinate of the text.
 * @param {number} width - The width of the text. (NOT USED)
 * @param {boolean} center - Whether to center the text on the canvas.
 * @param {string} font - The font family of the text.
 */
const newTextbox = (
  fontsize: number,
  fontweight: number,
  text: string,
  x: number,
  y: number,
  width: number,
  center: boolean,
  font: string,
  canvas?: fabric.Canvas
) => {
  console.log("[newTextbox] called");
  var newtext = new fabric.Textbox(text, {
    left: x,
    top: y,
    originX: "center",
    originY: "center",
    fontFamily: "Inter",
    fill: "#fff",
    fontSize: fontsize,
    fontWeight: fontweight,
    textAlign: "center",
    cursorWidth: 1,
    stroke: "#fff",
    strokeWidth: 0,
    cursorDuration: 1,
    paintFirst: "stroke",
    objectCaching: false,
    absolutePositioned: true,
    strokeUniform: true,
    inGroup: false,
    cursorDelay: 250,
    strokeDashArray: null,
    width: calculateTextWidth(
      text,
      fontweight + " " + fontsize + "px Inter",
      canvas
    ),
    id: "Text" + 0, // 0 FOR NOW -- George
    // shadow: {
    //   color: "#000",
    //   offsetX: 0,
    //   offsetY: 0,
    //   blur: 0,
    //   includeDefaultValues: true,
    //   nonScaling: false,
    // },
  });
  newtext.setControlsVisibility({
    mt: false,
    mb: false,
  });
  canvas?.add(newtext);
  // Attempt Fix for text top and left not correctly being set to center: move
  // setactiveobject to the end of function. --GEORGE
  // THIS IS NOT FIXING THE ISSUE. DAMN. --GEORGE
  // add this text element as a layer (a layer is a row in the timeline)
  newLayer(newtext, allObjects, p_keyframes, canvas!, 5000, 0);
  // canvas.setActiveObject(newtext);
  // canvas?.bringToFront(newtext);
  canvas?.bringObjectToFront(newtext);
  newtext.enterEditing();
  newtext.selectAll();
  canvas?.renderAll();
  if (center) {
    newtext.set("left", canvas?.get("left") + canvas?.get("width") / 2);
    newtext.set("top", canvas?.get("top") + canvas?.get("height") / 2);
    console.log("[newTextbox] centering text (this is a correct centering.)");
    canvas?.centerObject(newtext);
    canvas?.renderAll();
  }
  // set active here!
  canvas?.setActiveObject(newtext);
  newtext.set("fontFamily", font);
  canvas?.renderAll();
};

const calculateTextWidth = (
  text: string,
  font: string,
  canvas?: fabric.Canvas | fabric.StaticCanvas
) => {
  if (!canvas) {
    console.error("[calculateTextWidth] canvas is undefined");
  }
  let ctx = canvas!.getContext("2d");
  ctx.font = font;
  return ctx!.measureText(text).width + 10;
};

// Animate timeline (or seek to specific point in time)
// IMPROVED BY CHATGPT -- GEORGE
async function animate(
  play: boolean,
  time: number,
  canvas: fabric.Canvas,
  objects: fabric.Object[],
  p_keyframes: PKeyframe[],
  duration: number
) {
  // anime.speed = 1;

  let draggingPanel = false;
  if (!draggingPanel) {
    const starttime = new Date();
    const offset = time;
    const inst = canvas;
    let currenttime = 0;

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
    objects.forEach((object) => {
      if (!object.id.includes("Group")) {
        const object2 = canvas.getItemById(object.id);
        const pKeyframe = p_keyframes.find(
          (x) => x.id === object.id
        ) as PKeyframe;
        const isVisible =
          currenttime >= pKeyframe.trimstart + pKeyframe.start &&
          currenttime <= pKeyframe.end &&
          currenttime <= duration;

        object2?.set("visible", isVisible);
        inst.renderAll();
        if (isVisible) {
          props.forEach((prop) =>
            checkAnyKeyframe(object.id, prop, inst, objects)
          );
        }
      }

      // const obj = canvas.getItemById(object.id);
      // if (obj.type === "lottie") {
      //   obj.goToSeconds(currenttime);
      //   inst.renderAll();
      // }
    });

    inst.renderAll();

    // if (animatedtext.length > 0) {
    //   animatedtext.forEach((text) => {
    //     text.seek(currenttime, canvas);
    //     inst.renderAll();
    //   });
    // }
    // playVideos(time);
    // if (play) playAudio(time);

    if (play && !paused) {
      const animation = { value: 0 };
      const mainInstance = anime({
        targets: animation,
        value: [currenttime, duration],
        duration: duration - currenttime,
        easing: "linear",
        autoplay: true,
        update: () => {
          if (!paused) {
            currenttime = animation.value;
            // console.log(
            //   "[animate] animation update! current time: " + currenttime
            // );
            // if (animatedtext.length > 0) {
            //   animatedtext.forEach((text) => {
            //     text.seek(currenttime, canvas);
            //     inst.renderAll();
            //   });
            // }
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
                inst.renderAll();

                if (isVisible) {
                  props.forEach((prop) =>
                    checkAnyKeyframe(object.id, prop, inst, objects)
                  );
                }
              }

              // const obj = canvas.getItemById(object.id);
              // if (obj.type === "lottie") {
              //   obj.goToSeconds(currenttime);
              //   inst.renderAll();
              // }
            });

            inst.renderAll();

            // if (!recording) {
            //   renderTime();
            //   $("#seekbar").css({
            //     left: currenttime / timelinetime + offset_left,
            //   });
            // }
          } else {
            // pause();
            paused = true;
            animation.value = duration + 1;
            anime.remove(animation);
          }
        },
        complete: () => {
          // pause();
          paused = true;
        },
      });
    } else if (paused) {
      currenttime = time;
    }
  }

  console.log("[animate] animation ends");
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

/**
 * Create a Layer (which is a row in the timeline).
 * AUTOIMPROVED BY CHATGPT -- GEORGE
 * @param {fabric.Object} object
 */
function newLayer(
  newObject: fabric.Object,
  objects: fabric.Object[],
  p_keyframes: PKeyframe[],
  canvas: fabric.Canvas,
  duration: number,
  currenttime: number
) {
  // layer_count++;
  var color: string = "red";

  // Determine the color based on the object's type and assetType
  if (newObject.get("type") == "image") {
    color = object.get("assetType") == "video" ? "#106CF6" : "#92F711";
  } else if (newObject.get("type") == "textbox") {
    color = "#F7119B";
  } else if (
    ["rect", "group", "circle", "path"].includes(newObject.get("type"))
  ) {
    color =
      object.get("assetType") == "animatedText"
        ? "#F7119B"
        : object.get("assetType") == "audio"
        ? "#11C0F7"
        : "#9211F7";
  }

  // If the object is a video, audio or lottie, add it to the timeline
  if (
    ["video", "audio"].includes(newObject.get("assetType")) ||
    newObject.get("type") == "lottie"
  ) {
    objects.push({
      object: newObject,
      id: newObject.get("id"),
      label: newObject.get("id"),
      color: color,
      defaults: [],
      locked: [],
      mask: "none",
      start: 0,
      end: newObject.get("duration"),
    });

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
  } else {
    objects.push({
      object: newObject,
      id: newObject.get("id"),
      label: newObject.get("id"),
      color: color,
      defaults: [],
      locked: [],
      mask: "none",
    });

    // Handle keyframes for non-video/audio objects
    const start = newObject.get("notnew")
      ? newObject.get("starttime")
      : currenttime;
    const end = newObject.get("notnew")
      ? duration - newObject.get("starttime")
      : duration - currenttime;

    console.log("[newLayer] start and end" + start + " " + end);

    p_keyframes.push({
      start: start,
      end: end,
      trimstart: 0,
      trimend: end,
      object: newObject,
      id: newObject.get("id"),
    });
  }

  // Render the layer
  // renderLayer(object);

  // Set properties for objects that are not audio
  if (!newObject.get("assetType") || newObject.get("assetType") != "audio") {
    let currentObject = objects.find(
      (x) => x.id == newObject.id
    ) as fabric.Object;
    props.forEach(function (prop) {
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
        if (!["top", "scaleY", "stroke", "width", "height"].includes(prop)) {
          // renderProp(prop, object);
        }
        currentObject.defaults.push({ name: prop, value: newObject.get(prop) });
      }
    });
  } else {
    // Special handling for audio properties
    // renderProp("volume", object);
    let currentObject = objects.find(
      (x) => x.id == newObject.id
    ) as fabric.Object;
    currentObject.defaults.push({ name: "volume", value: 0 });
  }

  // Update layer selection and visibility
  // $(".layer-selected").removeClass("layer-selected");
  // $(`.layer[data-object='${object.get("id")}']`).addClass("layer-selected");
  // document.getElementsByClassName("layer-selected")[0].scrollIntoView();

  // console.log("[newLayer] before animate, object left and top: " + object.get('left') + " " + object.get('top'));

  // Initialize animations and save the state
  objects.find((x) => x.id == newObject.id).animate = [];
  animate(false, currenttime, canvas, objects, p_keyframes, duration);
  // console.log("[newLayer] after animate, object left and top: " + object.get('left') + " " + object.get('top'));
  // save();
  // checkFilter();
  console.log("[newLayer] layer created, newLayer() ends");
}

export default App;
