import React, { useRef, useState } from "react";
import "./App.css";
import ToolBar from "./components/ToolBar/ToolBar";
import RoomPanel from "./components/RoomPanel/RoomPanel";
import { Route, Routes } from "react-router-dom";
import Room from "./Pages/Room/Room";
import Home from "./Pages/Home/Home";
import { Toaster } from "react-hot-toast";
const App = () => {

  const [checkingRoom, setCheckingRoom] = useState(false);
  return (
    <div className="main-container">
      <Toaster/>
      <Routes>
        <Route path="/" element={<Home setCheckingRoom={setCheckingRoom}/>} />
        <Route path="/room/:roomId" element={<Room setCheckingRoom={setCheckingRoom} checkingRoom={checkingRoom} />} />
      </Routes>
    </div>
  );
};

export default App;
