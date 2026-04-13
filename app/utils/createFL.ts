import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export default async function createFaceLandmarker(isLoading: Ref, faceLandMarker: FaceLandmarker) {
    isLoading.value = true;
    const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
    faceLandMarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: "VIDEO",
        numFaces: 10,
    });
    isLoading.value = false;
}