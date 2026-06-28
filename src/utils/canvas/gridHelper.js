export const drawGrid = (ctx, canvas) => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const gridSize = 15;
    const dotRadius = 1.2;

    ctx.save();
    ctx.fillStyle = "#d1d5db";

    for (let y = 0; y < height; y += gridSize) {
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
};

export const snapToGrid = (value) => {
    const gridSize = 15;

    return Math.round(value / gridSize) * gridSize;
}