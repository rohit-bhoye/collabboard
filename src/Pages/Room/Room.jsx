import React, { useEffect, useState } from "react";
import "./Room.css";
import Canvas from "../../components/Canvas/Canvas";
import { useParams } from "react-router-dom";
import RoomPanel from "../../components/RoomPanel/RoomPanel";
import ToolBar from "../../components/ToolBar/ToolBar";
import { database } from "../../firebase";
import { set, ref } from "firebase/database";
import { onValue } from "firebase/database";
const Room = () => {
  const [canvasData, setCanvasData] = useState([
    [
      {
        id: "placeholder",
        type: "placeholder",
      },
    ],
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCanvas, setCurrentCanvas] = useState(canvasData[currentIndex]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(null);
  const { roomId } = useParams();

  let userId = sessionStorage.getItem("userId");

  if (!userId) {
    userId = crypto.randomUUID();
    sessionStorage.setItem("userId", userId);
  }

  //====================firebase data read/write===============\\
  useEffect(() => {
    set(ref(database, `rooms/${roomId}/createdAt`), Date.now());
  }, []);

  useEffect(() => {
    if (loading) return;
    set(ref(database, `rooms/${roomId}/canvasData`), {
      canvasData,
      currentIndex,
    });
  }, [canvasData, currentIndex, loading]);

  useEffect(() => {
    if (!live) return;
    set(ref(database, `rooms/${roomId}/live/${userId}`), live);
  }, [live]);

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomId}/live`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      const liveData = snapshot.val();

      if (!liveData) return;

      setCurrentCanvas((prev) => {
        return prev.map((element) => {
          let updatedElement = element;

          Object.entries(liveData).forEach(([id, live]) => {
            if (element.id === live.shapeId) {
              if (live.type === "MOVE") {
                updatedElement = {
                  ...element,
                  x: live.x,
                  y: live.y,
                };
              } else if (live.type === "RESIZE") {
                if (element.type === "rect") {
                  updatedElement = {
                    ...element,
                    x: live.x,
                    y: live.y,
                    width: live.width,
                    height: live.height,
                  };
                } else if (element.type === "text") {
                  updatedElement = {
                    ...element,
                    x: live.x,
                    y: live.y,
                    width: live.width,
                    height: live.height,
                    fontSize: live.fontSize,
                  };
                }
              }
            }
          });

          return updatedElement;
        });
      });
    });

    return () => unsubscribe();
  }, [roomId, userId]);

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomId}/canvasData`);
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setLoading(false);
        return;
      }
      setCanvasData(data.canvasData || [[]]);
      setCurrentIndex(data.currentIndex || 0);
      setCurrentCanvas(data.canvasData[data.currentIndex] || []);
      setLoading(false);
    });
  }, []);

  const addText = () => {
    const data = {
      id: crypto.randomUUID(),
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

    const MAX_HISTORY = 50;
    if (newCanvasData.length > MAX_HISTORY) {
      newCanvasData.shift();
    }
    setCanvasData(newCanvasData);
    setCurrentIndex(newCanvasData.length - 1);
    setCurrentCanvas(newCanvasData[newCanvasData.length - 1]);
  };

  const addRectangle = () => {
    const data = {
      id: crypto.randomUUID(),
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
    const MAX_HISTORY = 50;

    if (newCanvasData.length > MAX_HISTORY) {
      newCanvasData.shift();
    }
    setCanvasData(newCanvasData);
    setCurrentIndex(newCanvasData.length - 1);
    setCurrentCanvas(newCanvasData[newCanvasData.length - 1]);
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
        live={live}
        setLive={setLive}
        userId={userId}
      />
    </div>
  );
};

export default Room;
