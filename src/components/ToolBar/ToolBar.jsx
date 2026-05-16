import React from "react";
import "./ToolBar.css";
const ToolBar = ({ addRectangle }) => {
  return (
    <div className="toolbar-container">
      <button className="rectangle" onClick={addRectangle}>
        rectangle
      </button>
    </div>
  );
};

export default ToolBar;
