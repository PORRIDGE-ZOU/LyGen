"use client"; // next.js app router

// ------------------ IMPORTS ------------------
import React, { useState, useEffect } from "react";
import * as fabric from "fabric";
import { FabricObject, Canvas } from "fabric";
import { Box, Container } from "@mui/material";
import anime from "animejs/lib/anime.es.js";
import { PKeyframe, LyricsLine, LygenObject } from "../helpers/types";
import {
  props,
  p_keyframes,
  allObjects,
  globalRegulator,
} from "@/helpers/globals";
import {
  enhancedLyricsParse,
  enhancedLyricsParseWithString,
} from "@/helpers/lyricsParsing";
import LyricsColumn from "@/components/LyricsColumn";
import LyricSearch from "@/components/LyricsSearch";
import GeneralPanel from "@/components/GeneralPanel";
import WidgetPanel from "@/components/WidgetPanel";
import InfoPanel from "@/components/InfoPanel";
import { reselect } from "@/helpers/misc";
import { animate } from "@/helpers/animation";

// ------------------ MAIN COMPONENT ------------------
const App = () => {
  // ------------------ STATE VARIABLES ------------------
  const [canvas, setCanvas] = useState<fabric.Canvas>();
  const [videoDuration, setVideoDuration] = useState<number>(10000);
  // this currentTime is ONLY used for displaying now. This should exist because we want to re-render the UI when the time changes. -- GEORGE
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [filltext, setFillText] = useState("#ffffff");
  const [fillcolor, setFillColor] = useState("#ffffff");
  const [activeXPos, setActiveXPos] = useState<number>(0);
  const [activeYPos, setActiveYPos] = useState<number>(0);
  const [lyrics, setLyrics] = useState<string>("Test Lyrics\nTest Lyrics2");
  const [lyrics_forWidget, setLyrics_forWidget] = useState<string[][]>([[]]);

  // ------------------ Functions ------------------
  useEffect(() => {
    const canvas = new fabric.Canvas("canvas", {
      height: 540,
      width: 960,
      backgroundColor: "#000000",
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
      var object = null;
      var objects = this.getObjects();
      for (var i = 0, len = this.size(); i < len; i++) {
        if (objects[i].get("type") == "group") {
          if (objects[i].get("id") && objects[i].get("id") === name) {
            object = objects[i];
            break;
          }
          var wip = i;
          for (
            var o = 0;
            o < (objects[i] as fabric.Group)._objects.length;
            o++
          ) {
            if (
              (objects[wip] as fabric.Group)._objects[o].id &&
              (objects[wip] as fabric.Group)._objects[o].id === name
            ) {
              object = (objects[wip] as fabric.Group)._objects[o];
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
      let active = canvas.getActiveObject();
      let x = active?.get("left");
      let y = active?.get("top");
      setActiveXPos(x!);
      setActiveYPos(y!);
      let fill = active?.get("fill");
      setFillColor(fill!);

      let text = active?.get("text");
      if (text) {
        console.log("[canvasSetup] active text: ", text);
      }
    });

    canvas.on("selection:updated", (e) => {
      let active = canvas.getActiveObject();
      let x = active?.get("left");
      let y = active?.get("top");
      setActiveXPos(x!);
      setActiveYPos(y!);
      let fill = active?.get("fill");

      // TODO: I temporarily used this same code as in ColorPickerInput.tsx. We should refactor this into a helper function? The reason why I don't use onColorChange() is because that has a strange reselection bug. -- GEORGE
      if (fill.startsWith("rgb") && fill.includes(",") && fill.includes(")")) {
        const rgbValues = fill
          .substring(fill.indexOf("(") + 1, fill.indexOf(")"))
          .split(",")
          .map((val: string) => parseInt(val, 10));

        const hexColor = `#${rgbValues
          .map((val: { toString: (arg0: number) => string }) =>
            val.toString(16).padStart(2, "0")
          )
          .join("")}`;

        setFillColor(hexColor);
      } else {
        setFillColor(fill!);
      }

      let text = active?.get("text");
      if (text) {
        // console.log("[canvasSetup] UPDATED active text: ", text);
      }
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
    reselect(active!, canvas!);
    // canvas?.discardActiveObject();
  }

  function onColorChange(newcolor: string) {
    let active = canvas?.getActiveObject();
    active?.set({ fill: newcolor });
    canvas?.renderAll();
    reselect(active!, canvas!);
    setFillColor(newcolor);
    setFillText(newcolor);

    // canvas?.discardActiveObject();
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
        newAudioLayer(e.target!.result as string, canvas!);
        console.log(
          "[onAudioUpload] audio uploaded! audio duration: " + durationWhole
        );
      };
    };
    reader.readAsDataURL(file);
  };

  const onLyricsUpload = (file: File) => {
    enhancedLyricsParse(file, canvas!, onEnhancedLyricObjectsChange);
  };

  /** Do stuff after the new lyrics are uploaded and parsed */
  const onBasicLyricObjectsChange = (lyrics: LyricsLine[]) => {
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

  const onEnhancedLyricObjectsChange = (lyrics: LyricsLine[]) => {
    let newLyrics: string = "";
    let currentLyrics_forWidget: string[][] = [[]];
    let stringindex = 0;
    lyrics.forEach((word, index) => {
      newLyrics += word.text;
      currentLyrics_forWidget[stringindex].push(word.text);
      if (word.isEnhancedSentenceEnd) {
        newLyrics += "\n";
        stringindex++;
        currentLyrics_forWidget.push([]);
      } else {
        newLyrics += " ";
      }
    });
    setLyrics(newLyrics);
    setLyrics_forWidget(currentLyrics_forWidget);
    console.log(
      "[onEnhancedLyricObjectsChange] finished populating lyrics to widget/lyrics column"
    );
  };

  const onSeekToTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let time = parseFloat(event.target.value);
    if (time < 0 || time > videoDuration || isNaN(time)) {
      console.warn("[onSeekToTimeChange] invalid time: " + time);
      return;
    }
    globalRegulator.setCurrentTime(time);
    setCurrentTime(time);
    animate(false, time, canvas!, allObjects, p_keyframes, videoDuration);
  };

  const onLyricsSearchSuccess = (lyrics: string) => {
    // lyricsParseWithString(lyrics, canvas!, onLyricObjectsChange);
    enhancedLyricsParseWithString(
      lyrics,
      canvas!,
      onEnhancedLyricObjectsChange
    );
  };

  // ------------------ RENDER ------------------
  return (
    <Container
      disableGutters={true}
      maxWidth={false}
      style={{ width: "100vw", height: "100vh" }}
    >
      <Box display="flex" flexDirection="row" width="100%" height="65%">
        <Box width="25%">
          <LyricsColumn
            onLyricsChange={() => {}}
            lyrics={lyrics}
            setLyrics={setLyrics}
          />
          <LyricSearch onLyricsSearchSuccess={onLyricsSearchSuccess} />
        </Box>
        <Box width="100%">
          <canvas id="canvas" />
        </Box>
        <Box width="25%">
          <InfoPanel
            activeXPos={activeXPos}
            activeYPos={activeYPos}
            onPositionChange={onPositionChange}
            color={fillcolor}
            onColorChange={onColorChange}
            text={filltext}
            onTextChange={setFillText}
          ></InfoPanel>
        </Box>
      </Box>
      <Box display="flex" flexDirection="row" width="100%" height="35%">
        <Box width="30%" height="100%">
          <GeneralPanel
            onPlayClick={() => {
              globalRegulator.resume();
              animate(
                true,
                globalRegulator.currentTime,
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
            onPauseClick={() => {
              globalRegulator.pause();
            }}
            currentTime={currentTime}
            videoDuration={videoDuration}
            onChangeVideoDuration={onChangeVideoDuration}
            onAudioUpload={onAudioUpload}
            onLyricsUpload={onLyricsUpload}
            onSeekToTimeChange={onSeekToTimeChange}
          ></GeneralPanel>
        </Box>
        <Box whiteSpace={"pre-wrap"} width="70%" height="100%">
          <WidgetPanel currentLyrics={lyrics_forWidget}></WidgetPanel>
        </Box>
      </Box>
    </Container>
  );
};

/** Create a Layer (which is a row in the timeline).
 * AUTOIMPROVED BY CHATGPT -- GEORGE
 * @param {fabric.Object} object
 */
export function newLayer(
  newObject: FabricObject,
  objects: LygenObject[],
  p_keyframes: PKeyframe[],
  canvas: fabric.Canvas,
  duration: number,
  currenttime: number
) {
  // layer_count++;
  var color: string = "#FFFFFF";

  // Determine the color based on the object's type and assetType
  // NO use for
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
    var pushObject = new LygenObject(
      newObject.get("id"),
      newObject,
      "",
      color,
      "none",
      [],
      [],
      0,
      newObject.get("duration")
    );
    objects.push(pushObject);

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
    var pushObject = new LygenObject(
      newObject.get("id"),
      newObject,
      newObject.get("id"),
      color,
      "none",
      [],
      []
    );
    objects.push(pushObject);

    // Handle keyframes for non-video/audio objects
    const start = newObject.get("notnew")
      ? newObject.get("starttime")
      : currenttime;
    const end = newObject.get("notnew")
      ? newObject.get("endtime")
      : currenttime + duration;

    console.log("[newLayer] start and end" + start + " " + end);

    if (newObject.get("notnew")) {
      pushObject.start = start;
      pushObject.end = end;
    }

    // NOTE: I use the ID to check if it's animated text. This is a temporary solution. -- GEORGE
    if (newObject.get("id").includes("AnimText")) {
    }

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
  const foundObject = objects.find((x) => x.id == newObject.id);
  if (foundObject) {
    foundObject.animate = (animatable, options) => {
      return {};
    };
  }
  animate(false, currenttime, canvas, objects, p_keyframes, duration);
  // console.log("[newLayer] after animate, object left and top: " + object.get('left') + " " + object.get('top'));
  // save();
  // checkFilter();
  // console.log("[newLayer] layer created, newLayer() ends");
}

// Create an audio layer
function newAudioLayer(src: string, canvas: fabric.Canvas) {
  var audio = new Audio(src);
  audio.crossOrigin = "anonymous";
  audio.addEventListener("loadeddata", () => {
    var nullobject = new fabric.Rect({
      id: "Audio" + globalRegulator.getAndUpdateCurrentIndex(),
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
export function playAudio(
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
          if (start && !globalRegulator.paused) {
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
          } else if (globalRegulator.paused) {
            console.log("[playAudio] now pausing audio");
            if (!obj) {
            } else {
              if (obj.get("src")) {
                console.log("[playAudio] pausing audio 2");
                obj.get("src").pause();
                anime.remove(animation);
              }
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

/**
 * TODOs:
 * - the last line is not displayed properly.
 * - It's still kinda stuck and laggy. Maybe it's because of the way we're rendering the textboxes?
 * - We should have a timing offset for the words to start earlier than the actual time.
 */
