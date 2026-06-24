import React from "react";
import "./ToolBar.css";
const ToolBar = ({ activeTool, setActiveTool }) => {
  const handleRectangle = () => {
    setActiveTool("rect");
  };

  const handleAddText = () => {
    setActiveTool("text");
  };
  return (
    <div className="toolbar-container">
      <button className="rectangle" onClick={handleRectangle}>
        rectangle
      </button>
      <button className="addText" onClick={handleAddText}>
        𝐓
      </button>
    </div>
  );
};

export default ToolBar;
