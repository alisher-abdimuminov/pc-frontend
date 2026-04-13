export default function drawBorder(context: CanvasRenderingContext2D | null, canvasWidth: number, canvasHeight: number, strokeStyle: "green" | "red" | "white" | "orange" | "yellow") {
    if (context) {

        let wp = canvasWidth * 0.3;
        let hp = canvasHeight * 0.2;
        let w = canvasWidth - 2 * wp - 250;
        let h = canvasHeight - 2 * hp - 350;

        if (canvasWidth < 800) {
            wp = canvasWidth * 0.1;
            h = canvasHeight - 2 * hp - 400;
            w = 50;
        }

        context.beginPath();

        // config
        context.strokeStyle = strokeStyle;
        context.lineWidth = 4;

        // top left
        context.moveTo(wp, 100);
        context.lineTo(wp, 200);
        context.lineTo(wp, 100);
        context.lineTo(wp + 100, 100);
        context.stroke();

        // // top right
        context.moveTo(wp + 200 + w, 100);
        context.lineTo(wp + 300 + w, 100);
        context.lineTo(wp + 300 + w, 200);
        context.stroke();

        // // bottom left
        context.moveTo(wp, 450 + h);
        context.lineTo(wp, 550 + h);
        context.lineTo(wp + 100, 550 + h);
        context.stroke();

        // // bottom right
        context.moveTo(wp + 200 + w, 550 + h);
        context.lineTo(wp + 300 + w, 550 + h);
        context.lineTo(wp + 300 + w, 450 + h);
        context.stroke();

        context.closePath();
    }
}