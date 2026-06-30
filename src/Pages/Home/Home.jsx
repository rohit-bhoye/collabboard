import React, { useState } from "react";
import "./Home.css";
import Canvas from "../../components/Canvas/Canvas";
import ToolBar from "../../components/ToolBar/ToolBar";
import RoomPanel from "../../components/RoomPanel/RoomPanel";

const Home = () => {
  const [canvasData, setCanvasData] = useState([[]]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCanvas, setCurrentCanvas] = useState(canvasData[currentIndex]);
  const [activeTool, setActiveTool] = useState("select");

  const getTextBoxSize = (ctx, text, fontSize) => {
    const lines = text.split("\n");
    const lineHeight = fontSize + 5;

    ctx.font = `${fontSize}px sans-serif`;

    const width = Math.max(
      ...lines.map((line) => ctx.measureText(line || " ").width),
    );

    const height = lines.length * lineHeight;

    return {
      width,
      height,
    };
  };

  const addText = (canvas, ctx, x, y, value) => {
    const fontSize = 45;
    const size = getTextBoxSize(ctx, value, fontSize);
    const data = {
      id: crypto.randomUUID(),
      type: "text",
      x: x,
      y: y,
      text: value,
      width: size.width,
      height: size.height,
      fontSize: fontSize,
    };

    const newCanvasData = [
      ...canvasData.slice(0, currentIndex + 1),
      [...canvasData[currentIndex], data],
    ];
    setCanvasData(newCanvasData);
    setCurrentIndex(newCanvasData.length - 1);
    setCurrentCanvas(newCanvasData[newCanvasData.length - 1]);
    return data.id;
  };

  const addRectangle = (x, y) => {
    const data = {
      id: crypto.randomUUID(),
      type: "rect",
      x: x,
      y: y,
      width: 120,
      height: 75,
    };

    const newCanvasData = [
      ...canvasData.slice(0, currentIndex + 1),
      [...canvasData[currentIndex], data],
    ];
    setCanvasData(newCanvasData);
    setCurrentIndex(newCanvasData.length - 1);
    setCurrentCanvas(newCanvasData[newCanvasData.length - 1]);

    return data.id;
  };
  return (
    <div>
      <RoomPanel />
      <ToolBar activeTool={activeTool} setActiveTool={setActiveTool} />
      <Canvas
        addRectangle={addRectangle}
        addText={addText}
        canvasData={canvasData}
        setCanvasData={setCanvasData}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        currentCanvas={currentCanvas}
        setCurrentCanvas={setCurrentCanvas}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
      />
    </div>
  );
};

export default Home;
