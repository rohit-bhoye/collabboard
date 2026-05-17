import React from "react";
import "./ToolBar.css";
const ToolBar = ({ addRectangle, addText }) => {
  return (
    <div className="toolbar-container">
      <button className="rectangle" onClick={addRectangle}>
        rectangle
      </button>
      <button className="addText" onClick={addText}>
        𝐓
      </button>
    </div>
  );
};

export default ToolBar;
