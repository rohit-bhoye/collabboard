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

  const addText = (x, y) => {
    const data = {
      id: crypto.randomUUID(),
      type: "text",
      x: x,
      y: y,
      text: "Hello",
      width: 40,
      height: 40,
      fontSize: 40,
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
      width: 100,
      height: 80,
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
