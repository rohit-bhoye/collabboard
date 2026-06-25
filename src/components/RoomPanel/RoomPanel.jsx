import React, { useState } from "react";
import "./RoomPanel.css";
import { useNavigate, useParams } from "react-router-dom";
import { database } from "../../firebase";
import { ref, set } from "firebase/database";
import toast from "react-hot-toast";
const RoomPanel = ({ activeUsers }) => {
  const [joinRoomId, setJoinRoomId] = useState("");
  const { roomId } = useParams();
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    try {
      const id = Math.random().toString(36).slice(2, 12);
      const roomRef = ref(database, `rooms/${id}/createdAt`);

      await set(roomRef, Date.now());

      navigate(`/room/${id}`);
    } catch (error) {
      console.error("room creation failed:", error);
      toast.error("Could not create room", { duration: 3000 });
    }
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      toast.error("Write Room ID", { duration: 3000 });
      return;
    }
    navigate(`/room/${joinRoomId}`);
  };
  return (
    <div className="roomPanel-container">
      {!roomId && (
        <>
          <button className="createRoom-btn" onClick={handleCreateRoom}>
            Create Room
          </button>
          <div className="joinRoom-container">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
            />
            <button className="joinRoom-btn" onClick={handleJoinRoom}>
              Join Room
            </button>
          </div>
        </>
      )}

      {roomId && (
        <div>
          <p className="roomId">
            Room Id: <span>{roomId}</span>
          </p>
          <button className="share-btn">Share</button>
          <p className="usersOnline">
            Users online: <span>{activeUsers}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default RoomPanel;
