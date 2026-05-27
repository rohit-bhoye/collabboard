import React, { useRef, useState } from "react";
import "./App.css";

import ToolBar from "./components/ToolBar/ToolBar";
import RoomPanel from "./components/RoomPanel/RoomPanel";
import { Route, Routes } from "react-router-dom";
import Room from "./Pages/Room/Room";
import Home from "./Pages/Home/Home";
const App = () => {
  return (
    <div className="main-container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </div>
  );
};

export default App;
