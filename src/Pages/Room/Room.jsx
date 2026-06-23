import React, { useEffect, useState } from "react";
import "./Room.css";
import Canvas from "../../components/Canvas/Canvas";
import { useNavigate, useParams } from "react-router-dom";
import RoomPanel from "../../components/RoomPanel/RoomPanel";
import ToolBar from "../../components/ToolBar/ToolBar";
import { database } from "../../firebase";
import {
  set,
  ref,
  runTransaction,
  onDisconnect,
  remove,
  get,
} from "firebase/database";
import { onValue } from "firebase/database";
import toast from "react-hot-toast";
const Room = ({}) => {
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
  const [liveCursor, setLiveCursor] = useState(null);
  const [liveCursorsData, setLiveCursorsData] = useState({});
  const [allowedInRoom, setAllowedInRoom] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  const [checkingRoom, setCheckingRoom] = useState(true);
  const { roomId } = useParams();

  const MAX_USERS = 5;
  const MAX_HISTORY = 20;
  const navigate = useNavigate();
  let userId = sessionStorage.getItem("userId");

  if (!userId) {
    userId = crypto.randomUUID();
    sessionStorage.setItem("userId", userId);
  }

  //====================firebase data read/write===============\\

  useEffect(() => {
    if (!allowedInRoom) return;

    const roomRef = ref(database, `rooms/${roomId}/createdAt`);

    const roomCreation = async () => {
      try {
        const snapShot = await get(roomRef);

        if (!snapShot.exists()) {
          await set(roomRef, Date.now());
        }
      } catch (error) {
        console.error("createdAt check failed:", error);
      }
    };

    roomCreation();
  }, [allowedInRoom, roomId]);

  useEffect(() => {
    if (!allowedInRoom) return;
    const userRef = ref(database, `rooms/${roomId}/users/`);
    const unsubscribe = onValue(userRef, (snapShot) => {
      const data = snapShot.val();
      if (!data) {
        setActiveUsers(0);
        return;
      }

      setActiveUsers(Object.keys(data).length);
    });

    return () => unsubscribe();
  }, [allowedInRoom, roomId]);

  useEffect(() => {
    if (!roomId || !userId) return;
    const roomRef = ref(database, `rooms/${roomId}/createdAt`);

    const userRef = ref(database, `rooms/${roomId}/users/`);
    const currentUserRef = ref(database, `rooms/${roomId}/users/${userId}`);
    let joinedRoom = false;

    const joinRoom = async () => {
      try {
        const snapShot = await get(roomRef);

        if (!snapShot.exists()) {
          toast.error("Invalid Room ID", { duration: 3000 });
          setCheckingRoom(false);
          setAllowedInRoom(false);
          navigate("/");
          return;
        }
        const result = await runTransaction(userRef, (users) => {
          if (!users) {
            users = {};
          }

          if (users[userId]) {
            return users;
          }
          const totalUsers = Object.keys(users).length;

          if (totalUsers >= MAX_USERS) return;

          users[userId] = { joinedAt: Date.now() };
          return users;
        });

        if (!result.committed) {
          toast.error("Room is full", { duration: 3000 });
          setCheckingRoom(false);
          setAllowedInRoom(false);
          navigate("/");
          return;
        }

        joinedRoom = true;
        setCheckingRoom(false);
        setAllowedInRoom(true);

        onDisconnect(currentUserRef).remove();
      } catch (error) {
        toast.error("Could not join room", { duration: 3000 });
        setCheckingRoom(false);
        setAllowedInRoom(false);
        navigate("/");
      }
    };

    joinRoom();

    return () => {
      if (joinedRoom) {
        remove(currentUserRef);
      }
    };
  }, [roomId, userId, navigate]);

  useEffect(() => {
    if (!liveCursor || !allowedInRoom) return;
    set(ref(database, `rooms/${roomId}/liveCursor/${userId}`), liveCursor);
  }, [allowedInRoom, liveCursor, roomId, userId]);

  useEffect(() => {
    if (!allowedInRoom) return;
    const roomRef = ref(database, `rooms/${roomId}/liveCursor/`);
    const currentUserRef = ref(
      database,
      `rooms/${roomId}/liveCursor/${userId}`,
    );
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setLiveCursorsData({});
        return;
      }

      setLiveCursorsData(data);
    });
    onDisconnect(currentUserRef).remove();
    return () => {
      unsubscribe();
      remove(currentUserRef);
    };
  }, [allowedInRoom, roomId, userId]);

  useEffect(() => {
    if (loading || !allowedInRoom) return;
    set(ref(database, `rooms/${roomId}/canvasData`), {
      canvasData,
      currentIndex,
    });
  }, [allowedInRoom, canvasData, currentIndex, loading, roomId]);

  useEffect(() => {
    if (!live || !allowedInRoom) return;
    set(ref(database, `rooms/${roomId}/live/${userId}`), live);
  }, [allowedInRoom, live, roomId, userId]);

  useEffect(() => {
    if (!allowedInRoom) return;
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
  }, [allowedInRoom, roomId, userId]);

  useEffect(() => {
    if (!allowedInRoom) return;
    const roomRef = ref(database, `rooms/${roomId}/canvasData`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setLoading(false);
        return;
      }
      setCanvasData(data.canvasData || [[]]);
      setCurrentIndex(data.currentIndex || 0);
      setCurrentCanvas(data.canvasData?.[data.currentIndex] || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [allowedInRoom, roomId]);

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

    if (newCanvasData.length > MAX_HISTORY) {
      newCanvasData.shift();
    }
    setCanvasData(newCanvasData);
    setCurrentIndex(newCanvasData.length - 1);
    setCurrentCanvas(newCanvasData[newCanvasData.length - 1]);
  };

  if (checkingRoom) {
    return <div className="checking-room">Loading...</div>;
  }
  return (
    <div>
      {allowedInRoom && (
        <>
          <h1 className="roomId-title">Room:{roomId}</h1>
          <RoomPanel activeUsers={activeUsers} />
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
            liveCursor={liveCursor}
            setLiveCursor={setLiveCursor}
            liveCursorsData={liveCursorsData}
          />
        </>
      )}
    </div>
  );
};

export default Room;
