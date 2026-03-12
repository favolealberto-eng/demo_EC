const LayoutUno = {
    disegna: function (ctx) {
        ctx.fillStyle = "#3b82f6"; // Blu
        ctx.fillRect(0, 0, 500, 500);

        ctx.fillStyle = "white";
        ctx.font = "200px Arial";
        ctx.fillText("1", 200, 320);
    }
};