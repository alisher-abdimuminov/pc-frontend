export default function takePicture(canvas: HTMLCanvasElement, video: HTMLVideoElement, width: number, height: number) {
    console.log(canvas);
    console.log(video);
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    if (context) {
        context.drawImage(video, 0, 0, width, height, 0, 0, width, height);
        const data = canvas.toDataURL("image/png");
        return data;
    }
    return null;
}