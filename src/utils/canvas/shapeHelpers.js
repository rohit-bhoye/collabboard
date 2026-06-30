// ================= Draw helpers =================

export const drawElement = (ctx, element, selectedElementId, textEditor) => {
    if (
        textEditor?.mode === "edit" &&
        element.id === textEditor.elementId
    ) {
        return;
    }
    drawShape(ctx, element);
    if (element.id !== selectedElementId) return;

    const bounds = getElementBounds(ctx, element);
    if (!bounds) return;

    drawSelectionBorder(
        ctx,
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height
    );

}


const drawShape = (ctx, element) => {
    ctx.save();
    if (element.type === "rect") {
        ctx.fillStyle = "white";
        ctx.fillRect(element.x, element.y, element.width, element.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "black";
        ctx.strokeRect(element.x, element.y, element.width, element.height);

    } else if (element.type === "text") {

        ctx.font = `${element.fontSize}px sans-serif`;
        ctx.fillStyle = "black";

        ctx.textBaseline = "top";

        const lines = element.text.split("\n");
        const lineHeight = element.fontSize + 5;

        lines.forEach((line, index) => {
            ctx.fillText(line, element.x, element.y + index * lineHeight);
        });
    }
    ctx.restore();
}

const drawSelectionBorder = (ctx, x, y, width, height) => {
    ctx.save();
    const handleSize = 10;
    ctx.strokeStyle = "#0AC4E0";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    //resize box
    ctx.fillStyle = "white";
    ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);

    ctx.fillRect(x + width - handleSize / 2, y - handleSize / 2, handleSize, handleSize);

    ctx.fillRect(x - handleSize / 2, y + height - handleSize / 2, handleSize, handleSize);

    ctx.fillRect(x + width - handleSize / 2, y + height - handleSize / 2, handleSize, handleSize);

    ctx.strokeStyle = "#0AC4E0";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);

    ctx.strokeRect(x + width - handleSize / 2, y - handleSize / 2, handleSize, handleSize);

    ctx.strokeRect(x - handleSize / 2, y + height - handleSize / 2, handleSize, handleSize);

    ctx.strokeRect(x + width - handleSize / 2, y + height - handleSize / 2, handleSize, handleSize);

    ctx.restore();
}

// ================= Bounds / size helpers =================

const getElementBounds = (ctx, element) => {
    if (element.type === "rect") {
        return {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
        };
    }

    if (element.type === "text") {
        ctx.font = `${element.fontSize}px sans-serif`;

        const padding = 4;
        const lines = element.text.split("\n");
        const lineHeight = element.fontSize + 5;
        const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        const textHeight = lines.length * lineHeight;
        return {
            x: element.x - padding,
            y: element.y - padding,
            width: textWidth + padding * 2,
            height: textHeight + padding * 2,
        };
    }

    return null;
};

export const getElementSize = (ctx, element) => {
    if (element.type === "rect") {
        return {
            width: element.width,
            height: element.height,
        };
    }

    if (element.type === "text") {
         const bounds = getElementBounds(ctx, element);
        return {
            width: bounds.width,
            height: bounds.height,
        };
    }

    return {
        width: 0,
        height: 0,
    };
};

// ================= Hit detection helpers =================

export const isPointInsideElement = (ctx, element, mouseX, mouseY) => {
    const bounds = getElementBounds(ctx, element);
    if (!bounds) return false;

    return (
        mouseX >= bounds.x &&
        mouseX <= bounds.x + bounds.width &&
        mouseY >= bounds.y &&
        mouseY <= bounds.y + bounds.height
    )

}

export const getResizeHandle = (ctx, element, mouseX, mouseY, tol = 10) => {

    const bounds = getElementBounds(ctx, element);
    if (!bounds) return null;
    const isTopLeft =
        mouseX >= bounds.x - tol &&
        mouseX <= bounds.x + tol &&
        mouseY >= bounds.y - tol &&
        mouseY <= bounds.y + tol;

    const isTopRight =
        mouseX >= bounds.x + bounds.width - tol &&
        mouseX <= bounds.x + bounds.width + tol &&
        mouseY >= bounds.y - tol &&
        mouseY <= bounds.y + tol;

    const isBottomLeft =
        mouseX >= bounds.x - tol &&
        mouseX <= bounds.x + tol &&
        mouseY >= bounds.y + bounds.height - tol &&
        mouseY <= bounds.y + bounds.height + tol;

    const isBottomRight =
        mouseX >= bounds.x + bounds.width - tol &&
        mouseX <= bounds.x + bounds.width + tol &&
        mouseY >= bounds.y + bounds.height - tol &&
        mouseY <= bounds.y + bounds.height + tol;

    if (isTopLeft) return "isTopLeft";
    if (isTopRight) return "isTopRight";
    if (isBottomLeft) return "isBottomLeft";
    if (isBottomRight) return "isBottomRight";

    return null;
}

// ================= Resize helpers =================

export const getResizeSnapshot = (ctx,width, height, element) => {
    const bounds = getElementBounds(ctx, element);
    return {
        ...element,
        right: bounds.x + bounds.width,
        bottom: bounds.y + bounds.height,
        left: bounds.x,
        top: bounds.y,
        width,
        height,
    };
}

// ================= Cursor helpers =================

export const getCursorForResizeHandle = (handle) => {
    if (handle === "isTopLeft" || handle === "isBottomRight") {
        return "nwse-resize";
    }

    if (handle === "isTopRight" || handle === "isBottomLeft") {
        return "nesw-resize";
    }

    return "default";
};