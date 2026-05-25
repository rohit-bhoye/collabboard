import React, { useEffect, useRef, useState } from "react";
import "./Canvas.css";

const Canvas = ({
  currentIndex,
  setCurrentIndex,
  canvasData,
  setCanvasData,
  currentCanvas,
  setCurrentCanvas,
}) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastXRef = useRef(null);
  const lastYRef = useRef(null);
  const isDraggingRef = useRef(false);
  const selectedElementIdRef = useRef(null);

  const isResizingRef = useRef(false);
  const activehandleRef = useRef(null);
  const selectedElementRef = useRef(null);

  const offsetXRef = useRef(null);
  const offsetYRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    ctxRef.current = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctxRef.current.lineCap = "round";
    ctxRef.current.lineJoin = "round";
  }, []);

  //===============***================Helper Functions===============***================\\

  //===============*resize handle*================

  const getResizeHandle = (element, x, y, tol) => {
    const ctx = ctxRef.current;
    let width;
    let height;
    if (element.type === "rect") {
      width = element.width;
      height = element.height;
    } else if (element.type === "text") {
      width = ctx.measureText(element.text).width;
      height = element.fontSize;
    }
    const isTopLeft =
      x >= element.x - tol &&
      x <= element.x + tol &&
      y >= element.y - tol &&
      y <= element.y + tol;

    const isTopRight =
      x >= element.x + width - tol &&
      x <= element.x + width + tol &&
      y >= element.y - tol &&
      y <= element.y + tol;

    const isBottomLeft =
      x >= element.x - tol &&
      x <= element.x + tol &&
      y >= element.y + height - tol &&
      y <= element.y + height + tol;

    const isBottomRight =
      x >= element.x + width - tol &&
      x <= element.x + width + tol &&
      y >= element.y + height - tol &&
      y <= element.y + height + tol;

    return isBottomLeft || isBottomRight || isTopLeft || isTopRight || null;
  };

  //===============*inside shape*================

  const getIsInside = (element, x, y) => {
    const ctx = ctxRef.current;
    let width;
    let height;
    if (element.type === "rect") {
      width = element.width;
      height = element.height;
    } else if (element.type === "text") {
      width = ctx.measureText(element.text).width;
      height = element.fontSize;
    }
    const isInside =
      x >= element.x &&
      x <= element.x + width &&
      y >= element.y &&
      y <= element.y + height;
    return isInside;
  };

  //fillRect  helper function
  const fillRect = (x, y, width, height) => {
    const ctx = ctxRef.current;
    ctx.fillRect(x, y, width, height);
  };
  //strokeReact helper function
  const strokeRect = (x, y, width, height) => {
    const ctx = ctxRef.current;
    ctx.strokeRect(x, y, width, height);
  };

  //hitDetectionBorder function
  const hitDetectionBorder = (x, y, width, height) => {
    const ctx = ctxRef.current;
    ctx.strokeStyle = "#0AC4E0";
    ctx.lineWidth = 2;
    strokeRect(x, y, width, height);

    //resize box
    ctx.fillStyle = "white";
    fillRect(x - 10 / 2, y - 10 / 2, 10, 10);

    fillRect(x + width - 10 / 2, y - 10 / 2, 10, 10);

    fillRect(x - 10 / 2, y + height - 10 / 2, 10, 10);

    fillRect(x + width - 10 / 2, y + height - 10 / 2, 10, 10);

    ctx.strokeStyle = "#0AC4E0";
    ctx.lineWidth = 2;
    strokeRect(x - 10 / 2, y - 10 / 2, 10, 10);

    strokeRect(x + width - 10 / 2, y - 10 / 2, 10, 10);

    strokeRect(x - 10 / 2, y + height - 10 / 2, 10, 10);

    strokeRect(x + width - 10 / 2, y + height - 10 / 2, 10, 10);
  };

  //******************************Resize Rectangle******************************\\

  const resizeRectangle = (
    element,
    oldRight,
    oldBottom,
    oldLeft,
    oldTop,
    x,
    y,
  ) => {
    if (activehandleRef.current === "isTopLeft") {
      let width = oldRight - x;
      let height = oldBottom - y;
      let updatedX = x;
      let updatedY = y;
      if (width < 0) {
        width = Math.abs(width);
        updatedX -= width;
      }

      if (height < 0) {
        height = Math.abs(height);
        updatedY -= height;
      }
      return {
        ...element,
        x: updatedX,
        y: updatedY,
        width: width,
        height: height,
      };
    } else if (activehandleRef.current === "isBottomRight") {
      let width = x - oldLeft;
      let height = y - oldTop;
      let updatedX = selectedElementRef.current.x;
      let updatedY = selectedElementRef.current.y;
      if (width < 0) {
        width = Math.abs(width);
        updatedX -= width;
      }

      if (height < 0) {
        height = Math.abs(height);
        updatedY -= height;
      }
      return {
        ...element,
        x: updatedX,
        y: updatedY,
        width: width,
        height: height,
      };
    } else if (activehandleRef.current === "isTopRight") {
      let width = x - oldLeft;
      let height = oldBottom - y;
      let updatedX = selectedElementRef.current.x;
      let updatedY = y;
      if (width < 0) {
        width = Math.abs(width);
        updatedX -= width;
      }

      if (height < 0) {
        height = Math.abs(height);
        updatedY -= height;
      }
      return {
        ...element,
        x: updatedX,
        y: updatedY,
        width: width,
        height: height,
      };
    } else if (activehandleRef.current === "isBottomLeft") {
      let width = oldRight - x;
      let height = y - oldTop;
      let updatedX = x;
      let updatedY = selectedElementRef.current.y;
      if (width < 0) {
        width = Math.abs(width);
        updatedX -= width;
      }

      if (height < 0) {
        height = Math.abs(height);
        updatedY -= height;
      }
      return {
        ...element,
        x: updatedX,
        y: updatedY,
        width: width,
        height: height,
      };
    } else {
      return element;
    }
  };

  //******************************Resize Text******************************\\

  const resizeText = (element, oldRight, oldBottom, oldLeft, oldTop, x, y) => {
    const ctx = ctxRef.current;
    if (activehandleRef.current === "isTopLeft") {
      let width = oldRight - x;
      let height = oldBottom - y;

      width = Math.max(20, width);
      height = Math.max(20, height);

      const scaleX = width / selectedElementRef.current.width;

      const scaleY = height / selectedElementRef.current.height;

      const scale = Math.max(scaleX, scaleY);

      let updatedSize = selectedElementRef.current.fontSize * scale;

      updatedSize = Math.max(20, updatedSize);
      ctx.font = `${updatedSize}px sans-serif`;

      const measuredWidth = ctx.measureText(element.text).width;
      let updatedX = oldRight - measuredWidth;
      let updatedY = oldBottom - updatedSize;

      return {
        ...element,

        x: updatedX,
        y: updatedY,
        width: width,
        height: height,
        fontSize: updatedSize,
      };
    } else if (activehandleRef.current === "isBottomRight") {
      let width = x - oldLeft;
      let height = y - oldTop;

      width = Math.max(20, width);
      height = Math.max(20, height);

      const scaleX = width / selectedElementRef.current.width;

      const scaleY = height / selectedElementRef.current.height;

      const scale = Math.max(scaleX, scaleY);

      let updatedSize = selectedElementRef.current.fontSize * scale;

      updatedSize = Math.max(20, updatedSize);

      return {
        ...element,
        width: width,
        height: height,
        fontSize: updatedSize,
      };
    } else if (activehandleRef.current === "isTopRight") {
      let width = x - oldLeft;
      let height = oldBottom - y;
      width = Math.max(20, width);
      height = Math.max(20, height);

      const scaleX = width / selectedElementRef.current.width;

      const scaleY = height / selectedElementRef.current.height;

      const scale = Math.max(scaleX, scaleY);

      let updatedSize = selectedElementRef.current.fontSize * scale;

      updatedSize = Math.max(20, updatedSize);

      let updatedY = oldBottom - updatedSize;

      return {
        ...element,
        y: updatedY,
        width: width,
        height: height,
        fontSize: updatedSize,
      };
    } else if (activehandleRef.current === "isBottomLeft") {
      let width = oldRight - x;
      let height = y - oldTop;

      width = Math.max(20, width);
      height = Math.max(20, height);

      const scaleX = width / selectedElementRef.current.width;

      const scaleY = height / selectedElementRef.current.height;

      const scale = Math.max(scaleX, scaleY);

      let updatedSize = selectedElementRef.current.fontSize * scale;

      updatedSize = Math.max(20, updatedSize);
      ctx.font = `${updatedSize}px sans-serif`;
      const measuredWidth = ctx.measureText(element.text).width;

      let updatedX = oldRight - measuredWidth;

      return {
        ...element,

        x: updatedX,
        width: width,
        height: height,
        fontSize: updatedSize,
      };
    } else {
      return element;
    }
  };

  //===============================Draw Shapes===============================\\

  const draw = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    currentCanvas.forEach((element) => {
      if (element.type === "rect") {
        ctx.fillStyle = "white";
        fillRect(element.x, element.y, element.width, element.height);

        if (element.id === selectedElementIdRef.current) {
          hitDetectionBorder(
            element.x,
            element.y,
            element.width,
            element.height,
          );
        } else {
          ctx.lineWidth = 1;
          ctx.strokeStyle = "black";
          strokeRect(element.x, element.y, element.width, element.height);
        }
      } else if (element.type === "text") {
        ctx.font = `${element.fontSize}px sans-serif`;
        ctx.fillStyle = "black";

        ctx.textBaseline = "top";

        ctx.fillText(element.text, element.x, element.y);
        const textWidth = ctx.measureText(element.text).width;
        const textHeight = element.fontSize;
        const padding = 2;
        if (element.id === selectedElementIdRef.current) {
          hitDetectionBorder(
            element.x - padding,
            element.y - padding,
            textWidth + padding * 2,
            textHeight + padding * 2,
          );
        }
      }
    });
  };

  useEffect(() => {
    draw();
  }, [currentCanvas]);

  //===============================(DELETE) and (Undo/Redo)===============================\\
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentCanvas(canvasData[currentIndex - 1]);
          setCurrentIndex((prev) => prev - 1);
          selectedElementIdRef.current = null;
          selectedElementRef.current = null;
          canvasRef.current.style.cursor = "default";
          activehandleRef.current = null;
        }
      }

      if (e.ctrlKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        if (currentIndex < canvasData.length - 1) {
          setCurrentCanvas(canvasData[currentIndex + 1]);
          setCurrentIndex((prev) => prev + 1);
          selectedElementIdRef.current = null;
          selectedElementRef.current = null;
          canvasRef.current.style.cursor = "default";
          activehandleRef.current = null;
        }
      }

      const idToDelete = selectedElementIdRef.current;
      if (
        e.key === "Delete" &&
        selectedElementIdRef.current &&
        !isDraggingRef.current &&
        !isResizingRef.current
      ) {
        const updatedCurrentCanvas = currentCanvas.filter(
          (element) => element.id !== idToDelete,
        );
        setCurrentCanvas(updatedCurrentCanvas);
        const newCanvasData = [
          ...canvasData.slice(0, currentIndex + 1),
          updatedCurrentCanvas.map((element) => ({ ...element })),
        ];
        setCanvasData(newCanvasData);
        setCurrentIndex(newCanvasData.length - 1);
        selectedElementIdRef.current = null;
        selectedElementRef.current = null;
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentCanvas, canvasData, currentIndex]);

  //===============================ToggleCursor Function===============================\\

  const toggleCursor = (x, y) => {
    const canvas = canvasRef.current;

    if (!selectedElementIdRef.current) {
      canvas.style.cursor = "default";
      return;
    }

    const currentElement = canvasData[currentIndex].find(
      (element) => element.id === selectedElementIdRef.current,
    );
    if (!currentElement) return;
    const ctx = ctxRef.current;
    let width;
    let height;
    if (currentElement.type === "rect") {
      width = currentElement.width;
      height = currentElement.height;
    } else if (currentElement.type === "text") {
      width = ctx.measureText(currentElement.text).width;
      height = currentElement.fontSize;
    }
    const { x: elementX, y: elementY } = currentElement;
    const tol = 5;

    const isTopLeft =
      x >= elementX - tol &&
      x <= elementX + tol &&
      y >= elementY - tol &&
      y <= elementY + tol;

    const isTopRight =
      x >= elementX + width - tol &&
      x <= elementX + width + tol &&
      y >= elementY - tol &&
      y <= elementY + tol;

    const isBottomLeft =
      x >= elementX - tol &&
      x <= elementX + tol &&
      y >= elementY + height - tol &&
      y <= elementY + height + tol;

    const isBottomRight =
      x >= elementX + width - tol &&
      x <= elementX + width + tol &&
      y >= elementY + height - tol &&
      y <= elementY + height + tol;

    if (isTopLeft) {
      canvas.style.cursor = "nwse-resize";
      activehandleRef.current = "isTopLeft";
    } else if (isBottomRight) {
      canvas.style.cursor = "nwse-resize";
      activehandleRef.current = "isBottomRight";
    } else if (isTopRight) {
      canvas.style.cursor = "nesw-resize";
      activehandleRef.current = "isTopRight";
    } else if (isBottomLeft) {
      canvas.style.cursor = "nesw-resize";
      activehandleRef.current = "isBottomLeft";
    } else {
      canvas.style.cursor = "default";
      activehandleRef.current = null;
    }
  };

  //===============================Mouse Down===============================\\

  const handleMouseDown = (e) => {
    // isDrawingRef.current = true;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log(x, y, "hell");
    //resize activation
    if (activehandleRef.current) {
      isResizingRef.current = true;
    } else {
      isResizingRef.current = false;
    }
    // ctx.beginPath();
    // ctx.moveTo(x, y);
    lastXRef.current = x;
    lastYRef.current = y;

    let selectedElement = false;
    const tol = 10;
    for (let i = currentCanvas.length - 1; i >= 0; i--) {
      let element = currentCanvas[i];
      const handle = getResizeHandle(element, x, y, tol);
      const inside = getIsInside(element, x, y);

      //resize and drag selection logic

      if (handle) {
        if (isResizingRef.current) {
          const ctx = ctxRef.current;
          let width;
          let height;
          if (element.type === "rect") {
            width = element.width;
            height = element.height;
          } else if (element.type === "text") {
            ctx.font = `${element.fontSize}px sans-serif`;
            width = ctx.measureText(element.text).width;
            height = element.fontSize;
          }
          selectedElementIdRef.current = element.id;
          selectedElementRef.current = {
            ...element,
            right: element.x + width,
            bottom: element.y + height,
            left: element.x,
            top: element.y,
            width: width,
            height: height,
          };
          offsetXRef.current = x;
          offsetYRef.current = y;

          selectedElement = true;
        }
        break;
      } else if (inside) {
        selectedElementIdRef.current = element.id;
        isDraggingRef.current = true;
        selectedElement = true;
        offsetXRef.current = x - element.x;
        offsetYRef.current = y - element.y;
        console.log("Inside");
        break;
      }
    }

    if (!selectedElement) {
      selectedElementIdRef.current = null;
      selectedElementRef.current = null;
    }
    draw();
  };

  //===============================Mouse Move===============================\\

  const handleMouseMove = (e) => {
    // if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    //========================================resize start logic========================================

    if (isResizingRef.current && selectedElementRef.current) {
      const oldRight = selectedElementRef.current.right;
      const oldBottom = selectedElementRef.current.bottom;
      const oldLeft = selectedElementRef.current.left;
      const oldTop = selectedElementRef.current.top;
      setCurrentCanvas((prev) =>
        prev.map((element) => {
          if (element.id === selectedElementIdRef.current) {
            if (element.type === "rect") {
              return resizeRectangle(
                element,
                oldRight,
                oldBottom,
                oldLeft,
                oldTop,
                x,
                y,
              );
            } else if (element.type === "text") {
              return resizeText(
                element,
                oldRight,
                oldBottom,
                oldLeft,
                oldTop,
                x,
                y,
              );
            }
          } else {
            return element;
          }
        }),
      );
    }

    // const midX = (lastXRef.current + x) / 2;
    // const midY = (lastYRef.current + y) / 2;
    // ctx.quadraticCurveTo(lastXRef.current, lastYRef.current, midX, midY);
    // ctx.stroke();
    // lastXRef.current = midX;
    // lastYRef.current = midY;

    //========================================Drag start logic==============================================

    if (isDraggingRef.current && !isResizingRef.current) {
      setCurrentCanvas((prev) =>
        prev.map((element) => {
          if (element.id === selectedElementIdRef.current) {
            return {
              ...element,
              x: x - offsetXRef.current,
              y: y - offsetYRef.current,
            };
          } else {
            return element;
          }
        }),
      );
    }

    if (!isResizingRef.current) {
      toggleCursor(x, y);
    }
  };

  //===============================Mouse up===============================\\

  const handleMouseUp = () => {
    // isDrawingRef.current = false;
    if (isResizingRef.current || isDraggingRef.current) {
      const newCanvasData = [
        ...canvasData.slice(0, currentIndex + 1),
        currentCanvas.map((element) => ({ ...element })),
      ];
      setCanvasData(newCanvasData);
      setCurrentIndex(newCanvasData.length - 1);
    }

    isResizingRef.current = false;
    isDraggingRef.current = false;

    const ctx = ctxRef.current;
    ctx.closePath();
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    ></canvas>
  );
};

export default Canvas;
