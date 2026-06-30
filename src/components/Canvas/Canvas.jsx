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
import { drawGrid, snapToGrid } from "../../utils/canvas/gridHelper";

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
  const [textEditor, setTextEditor] = useState(null);
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
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;

    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctxRef.current = ctx;
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

      if (width >= 0 && width < 15) {
        width = 15;
        updatedX = oldRight - width;
      }

      if (width < 0 && width > -15) {
        width = -15;
      }

      if (width < 0) {
        width = Math.abs(width);
        updatedX = oldRight;
      }

      if (height >= 0 && height < 15) {
        height = 15;
        updatedY = oldBottom - height;
      }

      if (height < 0 && height > -15) {
        height = -15;
      }

      if (height < 0) {
        height = Math.abs(height);
        updatedY = oldBottom;
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

      if (width >= 0 && width < 15) {
        width = 15;
        updatedX = oldLeft;
      }
      if (width < 0 && width > -15) {
        width = -15;
      }

      if (width < 0) {
        width = Math.abs(width);
        updatedX = oldLeft - width;
      }

      if (height >= 0 && height < 15) {
        height = 15;
        updatedY = oldTop;
      }
      if (height < 0 && height > -15) {
        height = -15;
      }

      if (height < 0) {
        height = Math.abs(height);
        updatedY = oldTop - height;
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
      if (width >= 0 && width < 15) {
        width = 15;
        updatedX = oldLeft;
      }

      // Width: crossed left side but too small
      if (width < 0 && width > -15) {
        width = -15;
      }

      // Width: flipped to left side
      if (width < 0) {
        width = Math.abs(width);
        updatedX = oldLeft - width;
      }

      // Height: normal top side
      if (height >= 0 && height < 15) {
        height = 15;
        updatedY = oldBottom - height;
      }

      // Height: crossed bottom side but too small
      if (height < 0 && height > -15) {
        height = -15;
      }

      // Height: flipped to bottom side
      if (height < 0) {
        height = Math.abs(height);
        updatedY = oldBottom;
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
      if (width >= 0 && width < 15) {
        width = 15;
        updatedX = oldRight - width;
      }

      // Width: crossed right side but too small
      if (width < 0 && width > -15) {
        width = -15;
      }

      // Width: flipped to right side
      if (width < 0) {
        width = Math.abs(width);
        updatedX = oldRight;
      }

      // Height: normal bottom side
      if (height >= 0 && height < 15) {
        height = 15;
        updatedY = oldTop;
      }

      // Height: crossed top side but too small
      if (height < 0 && height > -15) {
        height = -15;
      }

      // Height: flipped to top side
      if (height < 0) {
        height = Math.abs(height);
        updatedY = oldTop - height;
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

  const measureTextBox = (ctx, text, fontSize) => {
    ctx.font = `${fontSize}px sans-serif`;
    const lines = text.split("\n");
    const lineHeight = fontSize + 5;
    const width = Math.max(...lines.map((line) => ctx.measureText(line).width));
    const height = lines.length * lineHeight;
    return { width, height };
  };

  const resizeText = (
    ctx,
    element,
    oldRight,
    oldBottom,
    oldLeft,
    oldTop,
    x,
    y,
  ) => {
    const padding = 4;
    const snap = selectedElementRef.current;

    const computeScale = (boxW, boxH) => {
      boxW = Math.max(15, boxW);
      boxH = Math.max(15, boxH);
      const scaleX = boxW / snap.width;
      const scaleY = boxH / snap.height;
      return Math.max(15, snap.fontSize * ((scaleX + scaleY) / 2));
    };

    if (activehandleRef.current === "isTopLeft") {
      const fontSize = computeScale(oldRight - x, oldBottom - y);
      const { width, height } = measureTextBox(ctx, element.text, fontSize);
      return {
        ...element,
        x: oldRight - width - padding,
        y: oldBottom - height - padding,
        width,
        height,
        fontSize,
      };
    }

    if (activehandleRef.current === "isBottomRight") {
      const fontSize = computeScale(x - oldLeft, y - oldTop);
      const { width, height } = measureTextBox(ctx, element.text, fontSize);
      return { ...element, width, height, fontSize }; // x,y (top-left) unchanged
    }

    if (activehandleRef.current === "isTopRight") {
      const fontSize = computeScale(x - oldLeft, oldBottom - y);
      const { width, height } = measureTextBox(ctx, element.text, fontSize);
      return {
        ...element,
        y: oldBottom - height - padding,
        width,
        height,
        fontSize,
      };
    }

    if (activehandleRef.current === "isBottomLeft") {
      const fontSize = computeScale(oldRight - x, y - oldTop);
      const { width, height } = measureTextBox(ctx, element.text, fontSize);
      return {
        ...element,
        x: oldRight - width - padding,
        width,
        height,
        fontSize,
      };
    }

    return element;
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
    x = snapToGrid(x);
    y = snapToGrid(y);
    switch (tool) {
      case "rect":
        return {
          type: "rect",
          x,
          y,
          width: 120,
          height: 75,
        };

      case "text":
        return {
          type: "text",
          x,
          y,
          text: "Add text",
          width: 45,
          height: 45,
          fontSize: 45,
        };

      default:
        return null;
    }
  };

  //===============================Draw Shapes===============================\\

  const draw = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;

    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    drawGrid(ctx, canvas);

    currentCanvas.forEach((element) => {
      drawElement(ctx, element, selectedElementIdRef.current, textEditor);
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
    textEditor,
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
      let snappedX = snapToGrid(x);
      let snappedY = snapToGrid(y);
      let newRect = addRectangle(snappedX, snappedY);
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
      let snappedX = snapToGrid(x);
      let snappedY = snapToGrid(y);

      setTextEditor({
        mode: "create",
        x: snappedX,
        y: snappedY,
        value: "",
        fontSize: 45,
      });
      // let newText = addText(snappedX, snappedY);

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
        selectedElementRef.current = getResizeSnapshot(
          ctx,
          width,
          height,
          element,
        );
        offsetXRef.current = x;
        offsetYRef.current = y;
        selectedElement = true;
        break;
      } else if (inside) {
        selectedElementIdRef.current = element.id;
        selectedElementRef.current = element;
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
        const snappedX = snapToGrid(x);
        const snappedY = snapToGrid(y);
        let updatedElement = null;
        if (selectedElementRef.current.type === "rect") {
          updatedElement = resizeRectangle(
            selectedElementRef.current,
            oldRight,
            oldBottom,
            oldLeft,
            oldTop,
            snappedX,
            snappedY,
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
            ctx,
            selectedElementRef.current,
            oldRight,
            oldBottom,
            oldLeft,
            oldTop,
            snappedX,
            snappedY,
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
        const snappedX = snapToGrid(x);
        const snappedY = snapToGrid(y);

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
                  snappedX,
                  snappedY,
                );
              } else if (element.type === "text") {
                return resizeText(
                  ctx,
                  element,
                  oldRight,
                  oldBottom,
                  oldLeft,
                  oldTop,
                  snappedX,
                  snappedY,
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
        const rawX = x - offsetXRef.current;
        const rawY = y - offsetYRef.current;
        const snappedX = snapToGrid(rawX);
        const snappedY = snapToGrid(rawY);
        const updated = {
          shapeId: selectedElementIdRef.current,
          type: "MOVE",
          x: snappedX,
          y: snappedY,
        };
        sendLive(updated);
      }
    } else {
      if (isDraggingRef.current && !isResizingRef.current) {
        setCurrentCanvas((prev) =>
          prev.map((element) => {
            if (element.id === selectedElementIdRef.current) {
              const rawX = x - offsetXRef.current;
              const rawY = y - offsetYRef.current;
              const snappedX = snapToGrid(rawX);
              const snappedY = snapToGrid(rawY);
              return {
                ...element,
                x: snappedX,
                y: snappedY,
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

  const getTextBoxSize = (ctx, text, fontSize) => {
    const lines = text.split("\n");
    const lineHeight = fontSize + 5;

    ctx.font = `${fontSize}px sans-serif`;

    const width = Math.max(
      ...lines.map((line) => ctx.measureText(line || " ").width),
    );

    const height = lines.length * lineHeight;

    return {
      width,
      height,
    };
  };

  const handleTextEditor = () => {
    if (!textEditor) return;
    const value = textEditor.value.trim();
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (textEditor.mode === "create") {
      if (value) {
        let newText = addText(canvas, ctx, textEditor.x, textEditor.y, value);
        selectedElementIdRef.current = newText;
      }
    }
    if (textEditor.mode === "edit") {
      if (value) {
        setCurrentCanvas((prev) => {
          return prev.map((element) => {
            if (element.id === textEditor.elementId) {
              const size = getTextBoxSize(ctx, value, element.fontSize);
              const updatedElement = {
                ...element,
                text: value,
                width: size.width,
                height: size.height,
              };

              selectedElementRef.current = updatedElement;
              return updatedElement;
            }

            return element;
          });
        });
      } else {
        setCurrentCanvas((prev) =>
          prev.filter((element) => element.id !== textEditor.elementId),
        );

        selectedElementIdRef.current = null;
        selectedElementRef.current = null;
      }
    }

    setTextEditor(null);
  };

  const handleDoubleClick = (e) => {
    const clickedElement = selectedElementRef.current;

    if (!clickedElement || clickedElement.type !== "text") return;

    setTextEditor({
      mode: "edit",
      elementId: clickedElement.id,
      x: clickedElement.x,
      y: clickedElement.y,
      value: clickedElement.text,
      fontSize: clickedElement.fontSize,
    });
  };

  // const textEditorRef = useRef(null);

  // useEffect(() => {
  //   if (textEditor && textEditorRef.current) {
  //     const el = textEditorRef.current;
  //     el.focus();
  //     el.setSelectionRange(el.value.length, el.value.length);
  //   }
  // }, [textEditor?.mode, textEditor?.elementId]); // refocus when opening, not on every keystroke

  const fontSize = textEditor?.fontSize ?? 45;
const lineHeight = fontSize + 5;
const padding = 4;

const MIN_WIDTH = 100;   // floor so an empty editor is still visible/clickable
const MIN_HEIGHT = lineHeight;

let editorWidth = MIN_WIDTH;
let editorHeight = MIN_HEIGHT + padding * 2;

if (textEditor && ctxRef.current) {
  const ctx = ctxRef.current;
  ctx.font = `${fontSize}px sans-serif`;
  const lines = (textEditor.value || "").split("\n");
  const textWidth = Math.max(
    ...lines.map((line) => ctx.measureText(line).width) // no " " fallback needed now, floor handles it
  );
  const textHeight = lines.length * lineHeight;

  editorWidth = Math.max(MIN_WIDTH, textWidth) + padding * 2;
  editorHeight = Math.max(MIN_HEIGHT, textHeight) + padding * 2;
}

  return (
    <div>
      {textEditor && (
        <textarea
          className="textEditor"
          value={textEditor.value}
          rows={1}
          onChange={(e) => {
            setTextEditor((prev) => ({
              ...prev,
              value: e.target.value,
            }));
          }}
          style={{
            position: "absolute",
            left: textEditor.x - padding,
            top: textEditor.y - padding,

            fontSize: `${fontSize}px`,
            lineHeight: `${lineHeight}px`,
            height: `${editorHeight*1.2}px`,
            width: `${editorWidth*1.2}px`,

            resize: "none",
            overflow: "hidden",

            padding: `0px ${padding}px`,
            boxSizing: "border-box",

            background: "transparent",
            border: "3px solid #0AC4E0",
            outline: "none",
            zIndex: 9999,
          }}
          onBlur={handleTextEditor}
        />
      )}

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      ></canvas>
    </div>
  );
};

export default Canvas;
