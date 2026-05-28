import React, { useEffect, useRef, useState } from "react";
import "./Room.css";
import Canvas from "../../components/Canvas/Canvas";
import { useParams } from "react-router-dom";
import RoomPanel from "../../components/RoomPanel/RoomPanel";
import ToolBar from "../../components/ToolBar/ToolBar";
import { database } from "../../firebase";
import { set, ref } from "firebase/database";
const Room = () => {
  const [canvasData, setCanvasData] = useState([[]]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCanvas, setCurrentCanvas] = useState(canvasData[currentIndex]);
  const { roomId } = useParams();

  const idRef = useRef(1);

  useEffect(() => {
    set(ref(database, `rooms/${roomId}`), {
      createdAt: Date.now(),
    });
  }, []);

  const addText = () => {
    const data = {
      id: idRef.current,
      type: "text",
      x: Math.round(window.innerWidth / 2 - 100),
      y: Math.round(window.innerHeight / 2 - 60),
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
    <div>
      <h1 className="roomId-title">Room:{roomId}</h1>
      <RoomPanel />
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

export default Room;
