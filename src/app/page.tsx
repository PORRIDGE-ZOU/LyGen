"use client"; // next.js app router

import React, { useState, useEffect } from "react";
import * as fabric from "fabric";
import { FabricObject, Canvas } from "fabric";
import { Box, Button, Container, Typography, TextField } from "@mui/material";
import anime from "animejs/lib/anime.es.js";
import { PKeyframe, LyricsLine } from "../components/types";
import { AudioUploadButton, TextUploadButton } from "@/components/FileUploader";
import { props, p_keyframes, allObjects } from "@/components/globals";
import ColorPickerInput from "@/components/ColorPickerInput";
import LyricsColumn from "@/components/LyricsColumn";
import LyricSearch from "@/components/LyricsSearch";

let paused = false;
let currentIndex = 0;
let globalDuration = 0;
let globalCurrentTime = 0;

const App = () => {
  const [canvas, setCanvas] = useState<fabric.Canvas>();
  const [videoDuration, setVideoDuration] = useState<number>(10000);
  // this currentTime is ONLY used for displaying now.
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [testStart, setTestStart] = useState<number>(2000);
  const [testEnd, setTestEnd] = useState<number>(5000);
  const [filltext, setFillText] = useState("#ffffff");
  const [fillcolor, setFillColor] = useState("#ffffff");
  const [activeXPos, setActiveXPos] = useState<number>(0);
  const [activeYPos, setActiveYPos] = useState<number>(0);
  const [lyrics, setLyrics] = useState<string>("Test Lyrics\nTest Lyrics2");

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
    canvasSetup(canvas);
    setCanvas(canvas);
    console.log("[App] canvas created and set");

    return () => {
      console.log("[App] canvas cleaning up");
      canvas.dispose();
    };
  }, []);

  function canvasSetup(canvas: fabric.Canvas) {
    canvas.on("selection:created", (e) => {
      console.log("[canvasSetup] selection created");
      let active = canvas.getActiveObject();
      console.log("[canvasSetup] active object: ", active);
      let x = active?.get("left");
      let y = active?.get("top");
      setActiveXPos(x!);
      setActiveYPos(y!);
      let fill = active?.get("fill");
      setFillColor(fill!);
      setFillText(fill!);
    });
  }

  function onPositionChange(
    event: React.ChangeEvent<HTMLInputElement>,
    pos: string
  ) {
    let active = canvas?.getActiveObject();
    if (pos === "x") {
      setActiveXPos(parseInt(event.target.value));
      active?.set({ left: parseInt(event.target.value) });
    } else {
      setActiveYPos(parseInt(event.target.value));
      active?.set({ top: parseInt(event.target.value) });
    }
    canvas?.renderAll();
    canvas?.discardActiveObject();
    reselect(active!, canvas!);
  }

  function onColorChange(newcolor: string) {
    let active = canvas?.getActiveObject();
    active?.set({ fill: newcolor });
    canvas?.renderAll();
    canvas?.discardActiveObject();
    reselect(active!, canvas!);
    setFillColor(newcolor);
    setFillText(newcolor);
  }

  const onChangeVideoDuration = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setVideoDuration(parseInt(event.target.value));
  };

  const onAudioUpload = (file: File) => {
    if (!file) {
      console.error("[onAudioUpload] file is undefined");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target || !e.target.result) {
        return;
      }
      const audio = new Audio(e.target.result as string);
      audio.onloadedmetadata = () => {
        let durationWhole = Math.ceil(audio.duration);
        setVideoDuration(durationWhole * 1000);
        globalDuration = durationWhole * 1000;
        newAudioLayer(e.target!.result as string, canvas!);
        console.log(
          "[onAudioUpload] audio uploaded! audio duration: " + durationWhole
        );
      };
    };
    reader.readAsDataURL(file);
  };

  const onLyricsUpload = (file: File) => {
    lyricsParse(file, canvas!, onLyricObjectsChange);
  };

  /** Do stuff after the new lyrics are uploaded and parsed */
  const onLyricObjectsChange = (lyrics: LyricsLine[]) => {
    let newLyrics: string = "";
    lyrics.forEach((line, index) => {
      var endTime = lyrics[index + 1]
        ? lyrics[index + 1].timeInSeconds
        : line.getTimeInSeconds() + 5;
      newLyrics += line.text;
      newLyrics += "[" + line.timeInSeconds + " -- " + endTime + "]\n";
    });
    setLyrics(newLyrics);
  };

  const onSeekToTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let time = parseFloat(event.target.value);
    if (time < 0 || time > videoDuration || isNaN(time)) {
      console.warn("[onSeekToTimeChange] invalid time: " + time);
      return;
    }
    globalCurrentTime = time;
    setCurrentTime(time);
    animate(
      false,
      globalCurrentTime,
      canvas!,
      allObjects,
      p_keyframes,
      videoDuration
    );
  };

  const onLyricsSearchSuccess = (lyrics: string) => {
    // lyricsParseWithString(lyrics, canvas!, onLyricObjectsChange);
    enhancedLyricsParseWithString(lyrics, canvas!, onLyricObjectsChange);
  };

  return (
    <Container
      disableGutters={true}
      maxWidth={false}
      style={{ width: "100vw", height: "100vh" }}
    >
      <Box display="flex" flexDirection="row" width="100%" height="65%">
        <Box width="25%">
          <Button onClick={() => addRect(canvas)}>New Rectangle</Button>
          <Button
            onClick={() =>
              newTextbox(
                30,
                700,
                "Hello World",
                480,
                270,
                200,
                false,
                "Inter",
                canvas
              )
            }
          >
            New Text Box
          </Button>
          <TextField
            id="outlined-number"
            label="Video Duration (in ms)"
            type="number"
            defaultValue={10000}
            value={videoDuration}
            InputLabelProps={{
              shrink: true,
            }}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              onChangeVideoDuration(event);
            }}
          />
          <Button
            onClick={() => {
              paused = false;
              animate(
                true,
                globalCurrentTime,
                canvas!,
                allObjects,
                p_keyframes,
                videoDuration,
                (time) => {
                  // clamp time to int
                  time = Math.floor(time);
                  setCurrentTime(time);
                }
              );
            }}
          >
            Play
          </Button>
          <Button
            onClick={() => {
              paused = true;
            }}
          >
            Pause
          </Button>
          <Typography>Current Time: {currentTime}</Typography>
          <AudioUploadButton onAudioUpload={onAudioUpload} />
          <TextUploadButton onLyricsUpload={onLyricsUpload} />
          <TextField
            id="testStartTime"
            label="TestStartTime"
            type="number"
            defaultValue={2000}
            value={testStart}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setTestStart(parseInt(event.target.value));
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            id="testEndTime"
            label="TestEndTime"
            type="number"
            defaultValue={5000}
            value={testEnd}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setTestEnd(parseInt(event.target.value));
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
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
                canvas,
                testStart,
                testEnd
              )
            }
          >
            TestTextBox
          </Button>
          <TextField
            id="seekToTime"
            label="seek to time (in ms)"
            type="number"
            defaultValue={2000}
            value={currentTime}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              onSeekToTimeChange(event);
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Box>
        <Box width="100%">
          <canvas id="canvas" />
        </Box>
        <Box width="25%">
          <Typography variant="h6">Information</Typography>
          <TextField
            id="textXPos"
            label="XPos"
            type="number"
            value={activeXPos}
            defaultValue={0}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              onPositionChange(event, "x");
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            id="textYPos"
            label="YPos"
            type="number"
            value={activeYPos}
            defaultValue={0}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              onPositionChange(event, "y");
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <ColorPickerInput
            color={fillcolor}
            setColor={onColorChange}
            text={filltext}
            setText={onColorChange}
          />
        </Box>
      </Box>
      <Box display="flex" flexDirection="row" width="100%" height="35%">
        <LyricsColumn
          onLyricsChange={() => {}}
          lyrics={lyrics}
          setLyrics={setLyrics}
        />
        <LyricSearch onLyricsSearchSuccess={onLyricsSearchSuccess} />
      </Box>
    </Container>
  );
};

// Reselect
function reselect(selection: FabricObject, canvas: fabric.Canvas) {
  if (!selection) {
    console.warn("[reselect] selection is undefined. May be some error.");
    return;
  }
  if (selection.get("type") == "activeSelection") {
    var objs = [];
    for (let so of selection._objects) {
      for (let obj of canvas.getObjects()) {
        if (obj.get("id") === so.get("id")) {
          objs.push(obj);
          break;
        }
      }
    }
    canvas.setActiveObject(
      new fabric.ActiveSelection(objs, {
        canvas: canvas,
      })
    );
    canvas.renderAll();
  } else {
    if (selection.get("type") == "group") {
      canvas.setActiveObject(
        canvas.getItemById(selection.get("id")) as FabricObject
      );
    } else {
      canvas.setActiveObject(selection);
    }
    canvas.renderAll();
  }
}

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
  canvas?: fabric.Canvas,
  startTime?: number,
  endTime?: number
) => {
  console.log("[newTextbox] called");
  var newtext = new fabric.Textbox(text, {
    left: x,
    top: y,
    originX: "center",
    originY: "center",
    fontFamily: "Inter",
    fill: "#ffffff",
    fontSize: fontsize,
    fontWeight: fontweight,
    textAlign: "center",
    cursorWidth: 1,
    stroke: "#ffffff",
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
    id: "Text" + currentIndex++,
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
  if (startTime && endTime) {
    newtext.set("notnew", true);
    newtext.set("starttime", startTime);
    newtext.set("endtime", endTime);
  }
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
    // canvas?.centerObject(newtext);
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
  canvas?: fabric.Canvas
) => {
  if (!canvas) {
    console.error("[calculateTextWidth] canvas is undefined");
  }
  let ctx = canvas!.getContext("2d");
  ctx.font = font;
  // TODO: mysterious offset -- GEORGE
  return ctx!.measureText(text).width + 10;
};

// Animate timeline (or seek to specific point in time)
// IMPROVED BY CHATGPT -- GEORGE
async function animate(
  play: boolean,
  currenttime: number,
  canvas: fabric.Canvas,
  objects: fabric.Object[],
  p_keyframes: PKeyframe[],
  duration: number,
  onTimeChange?: (time: number) => void
) {
  // anime.speed = 1;

  let draggingPanel = false;
  if (!draggingPanel) {
    const starttime = new Date();
    const offset = currenttime;
    const inst = canvas;

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
    if (play)
      playAudio(
        currenttime,
        objects,
        canvas!,
        p_keyframes,
        currenttime,
        duration
      );

    if (play && !paused) {
      const animation = { value: 0 };
      // initializes a new animation (inside animate())
      const mainInstance = anime({
        targets: animation,
        value: [currenttime, duration],
        duration: duration - currenttime,
        easing: "linear",
        autoplay: true,
        update: () => {
          if (!paused) {
            currenttime = animation.value;
            if (onTimeChange) {
              onTimeChange(currenttime);
            }
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
            paused = true;
            globalCurrentTime = currenttime;
            animation.value = duration + 1;
            anime.remove(animation);
          }
        },
        complete: () => {
          paused = true;
          globalCurrentTime = 0;
        },
      });
    } else if (paused) {
      globalCurrentTime = currenttime;
    }
  }
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
    console.log(
      "[newLayer] Pushed an audio. all p_keyframes: " +
        JSON.stringify(p_keyframes, null, 2)
    );
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
      ? newObject.get("endtime")
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
    // console.log("[newLayer] all p_keyframes: " + p_keyframes);
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
    currentObject.defaults.push({ name: "volume", value: 1 });
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

function lyricsParse(
  file: File,
  canvas: fabric.Canvas,
  onLyricsUpload: (e: LyricsLine[]) => any
) {
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function (e) {
    // alert file name
    console.log(reader.result);
    var lyrics = reader.result;
    lyricsParseWithString(lyrics as string, canvas, onLyricsUpload);
  };
}
function lyricsParseWithString(
  lyrics: String,
  canvas: fabric.Canvas,
  onLyricsUpload: (e: LyricsLine[]) => any
) {
  var lyricsArray = (lyrics as string).split("\n");
  var lyricsObjects: LyricsLine[] = [];
  lyricsArray.forEach(function (line) {
    var time = line.split("]")[0].split("[")[1];
    // text should start from the second character, because the first one is space
    var text = line.split("]")[1].substring(1);
    var lyrics = new LyricsLine(text, time);
    lyricsObjects.push(lyrics);
  });
  console.log(lyricsObjects);

  lyricsObjects.forEach(function (line, index) {
    // duration should be the next index's time - this time
    // var duration = 0;
    // duration = lyricsObjects[index + 1] ?
    //   (lyricsObjects[index + 1].timeInSeconds - line.timeInSeconds) * 1000 :
    //   5000; // HOW TO SET DEFAULT? --GEORGE
    var endTime = lyricsObjects[index + 1]
      ? lyricsObjects[index + 1].timeInSeconds * 1000
      : line.getTimeInSeconds() * 1000 + 5000;

    console.log(
      "[lyricsParse] start and endTime: " +
        line.timeInSeconds * 1000 +
        " " +
        endTime
    );
    newTextbox(
      30,
      700,
      line.getText(),
      960,
      540,
      200,
      true,
      "Inter",
      canvas,
      line.getTimeInSeconds() * 1000,
      endTime
    );
    // canvas.renderAll();
  });
  canvas.renderAll();
  onLyricsUpload(lyricsObjects);
}
function enhancedLyricsParse(
  file: File,
  canvas: fabric.Canvas,
  onLyricsUpload: (e: LyricsLine[]) => any
) {
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function (e) {
    console.log(reader.result);
    var lyrics = reader.result;
    enhancedLyricsParseWithString(lyrics as string, canvas, onLyricsUpload);
  };
}
function enhancedLyricsParseWithString(
  lyrics: String,
  canvas: fabric.Canvas,
  onLyricsUpload: (e: LyricsLine[]) => any
) {
  console.log("[enhanedLyricsParseWithString] lyrics: " + lyrics);
  var lyricsArray = (lyrics as string).split("\n");
  var lyricsObjects: LyricsLine[] = [];
  lyricsArray.forEach(function (line, index) {
    // each line is in this format: [00:08.69] <00:08.69> I <00:08.75>   <00:08.81> got <00:08.91>   <00:09.02> my <00:09.18>   <00:09.35> driver's <00:10.34>   <00:10.73> license <00:10.95>   <00:11.18> last <00:11.36>   <00:11.54> week
    console.log("line: " + line);
    if (line == "") {
      return;
    }

    // split out the [] part first
    var startTime = line.split("]")[0].split("[")[1]; // this will be "00:08.69"
    var nextLineStartTime = "";
    if (index != lyricsArray.length - 1) {
      nextLineStartTime = lyricsArray[index + 1].split("]")[0].split("[")[1];
    }
    var hasReachedEnd = false;
    var currentIndex = 0;
    var exeSafety = 0;
    while (!hasReachedEnd) {
      exeSafety++;
      if (exeSafety > 1000) {
        console.log("Safety break");
        break;
      }
      var nextLeftBracket = line.indexOf("<", currentIndex);
      var nextRightBracket = line.indexOf(">", currentIndex);
      var nextNextLeftBracket = line.indexOf("<", nextRightBracket);
      var nextNextRightBracket = line.indexOf(">", nextNextLeftBracket);
      if (nextNextLeftBracket == -1) {
        hasReachedEnd = true;
      }
      var wordStartTime = line.substring(nextLeftBracket + 1, nextRightBracket);
      var word = line.substring(
        nextRightBracket + 1,
        nextNextLeftBracket == -1 ? line.length : nextNextLeftBracket
      );
      var wordEndTime = line.substring(
        nextNextLeftBracket + 1,
        nextNextRightBracket
      );
      if (hasReachedEnd) {
        wordEndTime = nextLineStartTime;
      }
      word = word.trim();
      var lyrics = new LyricsLine(
        word,
        wordStartTime,
        true,
        hasReachedEnd,
        wordEndTime,
        nextLineStartTime
      );
      lyricsObjects.push(lyrics);
      console.log("new lyrics: " + lyrics.getText());

      currentIndex = nextNextRightBracket + 1;
    }
  });

  // loop over the lyrics objects, combine words into lines, and calculate the width of the line
  let ctx = canvas!.getContext("2d");
  ctx.font = "400 24px Source Sans Pro";
  var widthOfSpace = ctx.measureText(" ").width + 0;
  let lineWidths: number[] = [];
  var currentLine = "";
  var currentWidth = 0;
  lyricsObjects.forEach(function (word, index) {
    currentLine += word.getText();
    currentLine += " ";
    currentWidth += ctx.measureText(word.getText()).width + 0;
    currentWidth += widthOfSpace;
    if (word.isEnhancedSentenceEnd) {
      lineWidths.push(currentWidth);
      currentLine = "";
      currentWidth = 0;
    }
  });

  /**
   * TODO: look at the measurement of text below. Now, the schema is:
   * 1. Measure the text width of each word
   * 2. Measure the width of space " "
   * 3. Add them on to calculate the width of each line
   * 4. When we start adding textboxes, we calculate the starting position of each line by subtracting half of the line width from the center of the canvas
   * 5. We add the width of each word and the width of space to calculate the next position of the textbox. Since each box is ORIGIN-CENTERED, we need to separate the addition of text width into two halves.
   * Using this method, the text is centered, but the space between words is not consistent. This is very strange. I've also observed that the width measurement for each text block is NOT ACCURATE. --GEORGE
   */
  // loop over the lyrics objects, create textboxes for each word
  var currentLineIndex = 0;
  var centerX = 480;
  var nextXPos = 480 - lineWidths[currentLineIndex] / 2;
  console.log("INITIAL POSITION: " + nextXPos);
  lyricsObjects.forEach(function (word, index) {
    var endTime = word.enhancedSentenceEndTime * 1000;
    nextXPos += ctx.measureText(word.getText()).width / 2 + 0;

    newTextbox(
      24,
      400,
      word.getText(),
      nextXPos,
      270,
      200,
      false,
      "Source Sans Pro",
      canvas,
      word.getTimeInSeconds() * 1000,
      endTime
    );

    if (word.isEnhancedSentenceEnd) {
      currentLineIndex++;
      nextXPos = centerX - lineWidths[currentLineIndex] / 2;
    } else {
      nextXPos += ctx.measureText(word.getText()).width / 2;
      nextXPos += widthOfSpace;
      console.log(
        "current word: " +
          word.getText() +
          ", current word width: " +
          ctx.measureText(word.getText()).width
      );
      console.log("current space width: " + widthOfSpace);
      console.log("current next xpos: " + nextXPos);
    }
  });

  canvas.renderAll();
}

// Create an audio layer
function newAudioLayer(src: string, canvas: fabric.Canvas) {
  var audio = new Audio(src);
  audio.crossOrigin = "anonymous";
  audio.addEventListener("loadeddata", () => {
    var nullobject = new fabric.Rect({
      id: "Audio" + currentIndex++,
      width: 10,
      height: 10,
      audioSrc: src,
      duration: audio.duration * 1000,
      opacity: 0,
      selectable: false,
      volume: 0.5,
      assetType: "audio",
    });
    canvas.add(nullobject);
    newLayer(
      nullobject,
      allObjects,
      p_keyframes,
      canvas,
      audio.duration * 1000,
      0
    );
    canvas.renderAll();
  });
}

// Play background audio
function playAudio(
  time: number,
  objects: fabric.Object[],
  canvas: fabric.Canvas,
  p_keyframes: PKeyframe[],
  currenttime: number,
  duration: number
) {
  objects.forEach(async function (object) {
    var start = false;
    var obj = canvas.getItemById(object.id);
    if (!obj) {
      console.log("[playAudio] object not found");
      return;
    }
    if (obj.get("assetType") == "audio") {
      console.log("[playAudio] audio object found");
      var flag = false;
      var animation = {
        value: 0,
      };
      var instance = anime({
        targets: animation,
        value: [currenttime, duration],
        delay: 0,
        duration: duration,
        easing: "linear",
        autoplay: true,
        update: async function () {
          currenttime = animation.value;
          if (start && !paused) {
            let this_pkey = p_keyframes.find((x) => x.id == object.id);
            if (!this_pkey) {
              return;
            }
            if (!obj) {
              return; // just for preventing IDE error
            }
            if (
              !flag &&
              this_pkey.start <= currenttime &&
              this_pkey.end >= currenttime
            ) {
              if (obj.get("src")) {
                obj.get("src").currentTime =
                  (this_pkey.trimstart - this_pkey.start + currenttime) / 1000;
                obj.get("src").volume = obj.get("volume");
                obj.get("src").play();
                flag = true;
              } else {
                var audio = new Audio(obj.get("audioSrc"));
                obj.set("src", audio);
                audio.volume = obj.get("volume");
                audio.crossOrigin = "anonymous";
                audio.currentTime =
                  (this_pkey.trimstart - this_pkey.start + currenttime) / 1000;
                audio.play();
                flag = true;

                console.log("[playAudio] now playing audio src");
              }
            } else if (
              this_pkey.start >= currenttime ||
              this_pkey.end <= currenttime
            ) {
              if (obj.get("src")) {
                console.log(
                  "[playAudio] pausing audio 1 (I commented this out)"
                );
                obj.get("src").pause();
                // this original code seems to try to prevent the audio from multi-playing by setting flag = true. It does not work now, however -- it only pauses the active audio. --GEORGE
              }
            }
          } else if (paused) {
            console.log("[playAudio] now pausing audio");
            if (obj.get("src")) {
              console.log("[playAudio] pausing audio 2");
              obj.get("src").pause();
              anime.remove(animation);
            }
          }
        },
        changeBegin: function () {
          start = true;
        },
      });
    }
  });
}

export default App;
