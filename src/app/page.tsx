"use client"; // next.js app router

import React, { useState, useEffect } from "react";
import * as fabric from "fabric";
import { FabricObject } from "fabric";

const App = () => {
  const [canvas, setCanvas] = useState<fabric.Canvas>();

  useEffect(() => {
    const c = new fabric.Canvas("canvas", {
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

    c.renderAll();
    setCanvas(c);

    return () => {
      console.log("[App] canvas cleaning up");
      c.dispose();
    };
  }, []);

  const addRect = (canvas?: fabric.Canvas) => {
    const rect = new fabric.Rect({
      height: 280,
      width: 200,
      stroke: "#2BEBC8",
    });
    canvas?.add(rect);
    canvas?.requestRenderAll();
  };

  return (
    <div>
      <button onClick={() => addRect(canvas)}>Rectangle</button>
      <canvas id="canvas" />
    </div>
  );
};

export default App;
