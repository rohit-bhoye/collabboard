import React, { useState } from "react";
import "./RoomPanel.css";
const RoomPanel = ({ roomId, setRoomId }) => {
  const [joinRoomId, setJoinRoomId] = useState("");
  const handleCreateRoom = () => {
    const id = Math.random().toString(36).slice(2, 12);
    setRoomId(id);
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) return;
    setRoomId(joinRoomId);
  };
  return (
    <div className="roomPanel-container">
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
      <div>
        <p className="roomId">
          Room Id: <span>{roomId}</span>
        </p>
        <button className="share-btn">Share</button>
        <p className="usersOnline">
          Users online: <span>5</span>
        </p>
      </div>
    </div>
  );
};

export default RoomPanel;
