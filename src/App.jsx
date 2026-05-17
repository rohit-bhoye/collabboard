import React, { useRef, useState } from "react";
import "./App.css";
import Canvas from "./components/Canvas/Canvas";
import ToolBar from "./components/ToolBar/ToolBar";
const App = () => {
  const [canvasData, setCanvasData] = useState([[]]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCanvas, setCurrentCanvas] = useState(canvasData[currentIndex]);

  const idRef = useRef(1);

  const addText = () => {
    const data = {
      id: idRef.current,
      type: "text",
      x: Math.round(window.innerWidth / 2 - 100),
      y: Math.round(window.innerHeight / 2 - 60),
      text: "Hello",
      fontSize: 20,
    };

    const newCanvasData = [
      ...canvasData.slice(0, currentIndex + 1),
      [...canvasData[currentIndex], data],
    ];
    setCanvasData(newCanvasData);
    setCurrentIndex(newCanvasData.length - 1);
    setCurrentCanvas(newCanvasData[newCanvasData.length - 1]);
    idRef.current = idRef.current + 1;
  };

  const addRectangle = () => {
    const data = {
      id: idRef.current,
      type: "rect",
      x: Math.round(window.innerWidth / 2 - 100),
      y: Math.round(window.innerHeight / 2 - 60),
      width: 200,
      height: 120,
    };

    const newCanvasData = [
      ...canvasData.slice(0, currentIndex + 1),
      [...canvasData[currentIndex], data],
    ];
    setCanvasData(newCanvasData);
    setCurrentIndex(newCanvasData.length - 1);
    setCurrentCanvas(newCanvasData[newCanvasData.length - 1]);
    idRef.current = idRef.current + 1;
  };
  return (
    <div className="main-container">
      <ToolBar addRectangle={addRectangle} addText={addText} />
      <Canvas
        canvasData={canvasData}
        setCanvasData={setCanvasData}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        currentCanvas={currentCanvas}
        setCurrentCanvas={setCurrentCanvas}
      />
    </div>
  );
};

export default App;
