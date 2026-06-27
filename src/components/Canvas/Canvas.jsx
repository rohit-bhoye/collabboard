import React, { useEffect, useRef, useState } from "react";
import "./Canvas.css";
import { useParams } from "react-router-dom";
import { remove, set } from "firebase/database";
import { database } from "../../firebase";
import { ref } from "firebase/database";
import {
  drawElement,
  getCursorForResizeHandle,
  getElementSize,
  getResizeHandle,
  getResizeSnapshot,
  isPointInsideElement,
} from "../../utils/canvas/shapeHelpers";

const Canvas = ({
  addRectangle,
  addText,
  currentIndex,
  setCurrentIndex,
  canvasData,
  setCanvasData,
  currentCanvas,
  setCurrentCanvas,
  live,
  setLive,
  userId,
  liveCursor,
  setLiveCursor,
  liveCursorsData,
  livePreviewData,
  activeTool,
  setActiveTool,
  sendLivePreview,
  clearLivePreview,
}) => {
  const [previewShape, setPreviewShape] = useState(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastXRef = useRef(null);
  const lastYRef = useRef(null);
  const isDraggingRef = useRef(false);
  const selectedElementIdRef = useRef(null);

  const lastLiveTimeRef = useRef(0);
  const latestLiveRef = useRef(null);

  const lastCursorMoveRef = useRef(0);
  const lastPreviewSentRef = useRef(0);

  const isResizingRef = useRef(false);
  const activehandleRef = useRef(null);
  const selectedElementRef = useRef(null);

  const offsetXRef = useRef(null);
  const offsetYRef = useRef(null);

  const { roomId } = useParams();
  const isRoom = Boolean(roomId);

  useEffect(() => {
    const canvas = canvasRef.current;
    ctxRef.current = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctxRef.current.lineCap = "round";
    ctxRef.current.lineJoin = "round";
  }, []);

  useEffect(() => {
    if (activeTool !== "rect" && activeTool !== "text") {
      setPreviewShape(null);

      if (isRoom) {
        clearLivePreview();
      }
    }
  }, [activeTool]);

  //===============***================Helper Functions===============***================\\

  //===============*Throttle*================

  const LIVE_INTERVAL = 1000 / 65;
  const sendLive = (updated) => {
    latestLiveRef.current = updated;
    const now = performance.now();

    if (now - lastLiveTimeRef.current >= LIVE_INTERVAL) {
      lastLiveTimeRef.current = now;
      setLive(updated);
    }
  };

  const sendCursor = (x, y) => {
    const now = performance.now();
    if (now - lastCursorMoveRef.current >= LIVE_INTERVAL) {
      let data = {
        x: x,
        y: y,
      };
      lastCursorMoveRef.current = now;
      setLiveCursor(data);
    }
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

  const drawPreview = (ctx, data, id) => {
    if (data.type === "rect") {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#dbeafe";
      ctx.fillRect(data.x, data.y, data.width, data.height);
      ctx.restore();
    } else if (data.type === "text") {
      ctx.save();
      ctx.globalAlpha = 0.35;

      ctx.font = `${data.fontSize}px sans-serif`;
      ctx.fillStyle = "black";
      ctx.textBaseline = "top";

      ctx.fillText(data.text, data.x, data.y);
      ctx.restore();
    }
  };

  const drawRemoteCursor = (ctx, cursor, id) => {
    ctx.save();

    const x = cursor.x;
    const y = cursor.y;

    // cursor triangle
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 12, y + 5);
    ctx.lineTo(x + 5, y + 12);
    ctx.closePath();

    ctx.fillStyle = "black";
    ctx.fill();

    // small user label
    ctx.font = "12px sans-serif";
    ctx.fillText(id.slice(0, 4), x + 14, y + 14);

    ctx.restore();
  };

  const createPreviewShape = (tool, x, y) => {
    switch (tool) {
      case "rect":
        return {
          type: "rect",
          x,
          y,
          width: 100,
          height: 80,
        };

      case "text":
        return {
          type: "text",
          x,
          y,
          text: "Add text",
          width: 40,
          height: 40,
          fontSize: 40,
        };

      default:
        return null;
    }
  };

  //===============================Draw Shapes===============================\\

  const draw = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    currentCanvas.forEach((element) => {
      drawElement(ctx, element, selectedElementIdRef.current);
    });

    if (previewShape) {
      if (activeTool === "rect") {
        canvas.style.cursor = "crosshair";
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "#dbeafe";
        ctx.fillRect(
          previewShape.x,
          previewShape.y,
          previewShape.width,
          previewShape.height,
        );
        ctx.restore();
      } else if (activeTool === "text") {
        canvas.style.cursor = "crosshair";
        ctx.save();
        ctx.globalAlpha = 0.35;

        ctx.font = `${previewShape.fontSize}px sans-serif`;
        ctx.fillStyle = "black";
        ctx.textBaseline = "top";

        ctx.fillText(previewShape.text, previewShape.x, previewShape.y);
        ctx.restore();
      }
    }

    if (isRoom) {
      Object.entries(liveCursorsData).forEach(([id, cursor]) => {
        if (id === userId) return; // don't draw my own cursor
        if (cursor.x == null || cursor.y == null) return;

        drawRemoteCursor(ctx, cursor, id);
      });

      Object.entries(livePreviewData).forEach(([id, data]) => {
        if (id === userId) return; // don't draw my own preview
        if (!data) return;

        drawPreview(ctx, data, id);
      });
    }
  };

  useEffect(() => {
    draw();
  }, [
    currentCanvas,
    liveCursorsData,
    userId,
    previewShape,
    activeTool,
    livePreviewData,
  ]);

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
        const MAX_HISTORY = 20;
        const newCanvasData = [
          ...canvasData.slice(0, currentIndex + 1),
          updatedCurrentCanvas.map((element) => ({ ...element })),
        ];

        if (newCanvasData.length > MAX_HISTORY) {
          newCanvasData.shift();
        }
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

  const toggleCursor = (ctx, x, y) => {
    const canvas = canvasRef.current;

    if (!selectedElementIdRef.current) {
      canvas.style.cursor = "default";
      activehandleRef.current = null;
      return;
    }

    const currentElement = currentCanvas.find(
      (element) => element.id === selectedElementIdRef.current,
    );
    if (!currentElement) return;
    const handle = getResizeHandle(ctx, currentElement, x, y, 10);
    const cursor = getCursorForResizeHandle(handle);
    canvas.style.cursor = cursor;
    activehandleRef.current = handle || null;
  };

  //===============================Mouse Down===============================\\

  const handleMouseDown = (e) => {
    // isDrawingRef.current = true;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "rect") {
      let newRect = addRectangle(x, y);
      selectedElementIdRef.current = newRect;
      selectedElementRef.current = null;
      activehandleRef.current = null;
      isDraggingRef.current = false;
      isResizingRef.current = false;
      if (isRoom) {
        clearLivePreview();
      }
      setPreviewShape(null);
      setActiveTool("select");
      canvas.style.cursor = "default";
      return;
    }

    if (activeTool === "text") {
      let newText = addText(x, y);
      selectedElementIdRef.current = newText;
      selectedElementRef.current = null;
      activehandleRef.current = null;
      isDraggingRef.current = false;
      isResizingRef.current = false;
      if (isRoom) {
        clearLivePreview();
      }
      setPreviewShape(null);
      setActiveTool("select");
      return;
    }

    // ctx.beginPath();
    // ctx.moveTo(x, y);
    lastXRef.current = x;
    lastYRef.current = y;

    let selectedElement = false;
    const tol = 10;
    for (let i = currentCanvas.length - 1; i >= 0; i--) {
      let element = currentCanvas[i];
      const handle = getResizeHandle(ctx, element, x, y, tol);
      const inside = isPointInsideElement(ctx, element, x, y);

      //resize and drag selection logic

      if (handle) {
        activehandleRef.current = handle;
        isResizingRef.current = true;

        const { width, height } = getElementSize(ctx, element);

        selectedElementIdRef.current = element.id;
        selectedElementRef.current = getResizeSnapshot(width, height, element);
        offsetXRef.current = x;
        offsetYRef.current = y;
        selectedElement = true;
        break;
      } else if (inside) {
        selectedElementIdRef.current = element.id;
        isDraggingRef.current = true;
        selectedElement = true;
        offsetXRef.current = x - element.x;
        offsetYRef.current = y - element.y;
        break;
      }
    }

    if (!selectedElement) {
      selectedElementIdRef.current = null;
      selectedElementRef.current = null;
      activehandleRef.current = null;
      canvas.style.cursor = "default";
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

    if (isRoom) {
      sendCursor(x, y);
    }

    const previewData = createPreviewShape(activeTool, x, y);

    if (previewData) {
      setPreviewShape(previewData);

      if (isRoom) {
        const now = performance.now();

        if (now - lastPreviewSentRef.current >= LIVE_INTERVAL) {
          sendLivePreview(previewData);
          lastPreviewSentRef.current = now;
        }
      }

      return;
    }

    //========================================resize start logic========================================

    if (isRoom) {
      if (isResizingRef.current && selectedElementRef.current) {
        const oldRight = selectedElementRef.current.right;
        const oldBottom = selectedElementRef.current.bottom;
        const oldLeft = selectedElementRef.current.left;
        const oldTop = selectedElementRef.current.top;
        let updatedElement = null;
        if (selectedElementRef.current.type === "rect") {
          updatedElement = resizeRectangle(
            selectedElementRef.current,
            oldRight,
            oldBottom,
            oldLeft,
            oldTop,
            x,
            y,
          );

          const updated = {
            shapeId: updatedElement.id,
            type: "RESIZE",
            x: updatedElement.x,
            y: updatedElement.y,
            width: updatedElement.width,
            height: updatedElement.height,
          };
          sendLive(updated);
        } else if (selectedElementRef.current.type === "text") {
          updatedElement = resizeText(
            selectedElementRef.current,
            oldRight,
            oldBottom,
            oldLeft,
            oldTop,
            x,
            y,
          );

          const updated = {
            shapeId: updatedElement.id,
            type: "RESIZE",
            x: updatedElement.x,
            y: updatedElement.y,
            width: updatedElement.width,
            height: updatedElement.height,
            fontSize: updatedElement.fontSize,
          };
          sendLive(updated);
        }
      }
    } else {
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
    }

    // const midX = (lastXRef.current + x) / 2;
    // const midY = (lastYRef.current + y) / 2;
    // ctx.quadraticCurveTo(lastXRef.current, lastYRef.current, midX, midY);
    // ctx.stroke();
    // lastXRef.current = midX;
    // lastYRef.current = midY;

    //========================================Drag start logic==============================================

    if (isRoom) {
      if (isDraggingRef.current && !isResizingRef.current) {
        const updated = {
          shapeId: selectedElementIdRef.current,
          type: "MOVE",
          x: x - offsetXRef.current,
          y: y - offsetYRef.current,
        };
        sendLive(updated);
      }
    } else {
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
    }

    if (!isResizingRef.current) {
      toggleCursor(ctx, x, y);
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
      const MAX_HISTORY = 20;

      if (newCanvasData.length > MAX_HISTORY) {
        newCanvasData.shift();
      }

      setCanvasData(newCanvasData);
      setCurrentIndex(newCanvasData.length - 1);
    }
    if (isRoom) {
      if (latestLiveRef.current) {
        setLive(latestLiveRef.current);
      }

      remove(ref(database, `rooms/${roomId}/live/${userId}`));
      latestLiveRef.current = null;
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
      onMouseLeave={handleMouseUp}
    ></canvas>
  );
};

export default Canvas;
