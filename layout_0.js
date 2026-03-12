const LayoutZero = {
    disegna: function (ctx) {
        ctx.fillStyle = "#ef4444"; // Rosso
        ctx.fillRect(0, 0, 500, 500);

        ctx.fillStyle = "white";
        ctx.font = "200px Arial";
        ctx.fillText("0", 200, 320);
    }
};