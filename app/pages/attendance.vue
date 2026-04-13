<script setup lang="ts">
import { toast } from "vue-sonner";
import drawBorder from "~/utils/drawBorder";
import takePicture from "~/utils/takePicture";
import { LucideRefreshCw } from "lucide-vue-next";
import rodriguesRotationVectorFromMatrix from "~/utils/rodrigues";
import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult } from "@mediapipe/tasks-vision";


definePageMeta({
    layout: "empty",
    middleware: 'is-auth'
});

const { user } = useAuth();


const isLoading = ref(true);
const process = ref(true);
let lastVideoTime = -1;
let videoWidth = 400;
let cameraWidth = 0;
let cameraHeight = 0;
let status = false;
let centerText = ref("Kameraga ruxsat bering");
let reload = ref(false);
let color = ref("white");

let faceLandMarker: FaceLandmarker;
let results: FaceLandmarkerResult | null = null;


async function createFaceLandmarker() {
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

const reloadFunc = () => {
    location.reload();
};



onMounted(async () => {
    await createFaceLandmarker();
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let canvas = document.getElementById("canvas") as HTMLCanvasElement;
    let photo = document.getElementById("photo") as HTMLCanvasElement;
    let video = document.getElementById("video") as HTMLVideoElement;
    canvas.width = windowWidth;
    canvas.height = windowHeight;
    let context = canvas.getContext("2d");
    if (context) {
        drawBorder(context, windowWidth, windowHeight, "white");
    }


    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            video.srcObject = stream;
            video.addEventListener("loadeddata", predictWebcam);
            let settings = stream.getVideoTracks()[0].getSettings();
            cameraWidth = settings.width || 0;
            cameraHeight = settings.height || 0;
        });

    async function send() {
        isLoading.value = true;
        let image = takePicture(photo, video, cameraWidth, cameraHeight);
        if (image) {
            let response = await $fetch<{ status: "success" | "error", code: string, data: string; }>(apify("student/make_attendance"), {
                method: "POST",
                body: JSON.stringify({
                    "image": image,
                    "longitude": "",
                    "latitude": "",
                }),
                headers: {
                    "Authorization": `Token ${user.value?.token}`
                }
            });

            if (response.status === "error") {
                if (response.code === "out_of_time_range") {
                    centerText.value = "Davomatdan o'tish vaqti emas";
                    color.value = "red";
                    navigateTo({ name: "index" });
                    toast("Xatolik", {
                        description: "Davomatdan o'tish vaqti emas"
                    });
                } else if (response.code === "already_verified") {
                    centerText.value = "Siz davomatdan o'tgansiz.";
                    color.value = "orange";
                    navigateTo({ name: "index" });
                    toast("Xatolik", {
                        description: "Siz davomatdan o'tgansiz."
                    });
                } else if (response.code === "verification_system_error") {
                    centerText.value = "Kechirasiz, Yuzni aniqlab bo'lmadi. Qaytadan urinib ko'ring.";
                    color.value = "red";
                    reload.value = true;
                } else if (response.code === "not_verified") {
                    centerText.value = "Kechirasiz, Yuzlar mos kelmadi. Qaytadan urinib ko'ring.";
                    color.value = "red";
                    reload.value = true;
                }
            } else {
                navigateTo({ name: "index" });
            }

            console.log(response);
        }
        isLoading.value = false;
    }


    async function predictWebcam() {
        // console.log(faceLandMarker);
        const radio = video.videoHeight / video.videoWidth;

        let startTimeMS = performance.now();

        if (lastVideoTime !== video.currentTime) {
            lastVideoTime = video.currentTime;
            results = faceLandMarker.detectForVideo(video, startTimeMS);
        }

        let x1 = cameraWidth;
        let y1 = cameraHeight;
        let x2 = 0;
        let y2 = 0;

        if (results) {
            if (results.faceLandmarks.length === 1) {
                results.faceLandmarks.forEach((element) => {
                    for (let a of element) {
                        let cordX = a.x * cameraWidth;
                        let cordY = a.y * cameraHeight;

                        if (cordX < x1) {
                            x1 = cordX;
                        }
                        if (cordY < y1) {
                            y1 = cordY;
                        }
                        if (cordX > x2) {
                            x2 = cordX;
                        }
                        if (cordY > y2) {
                            y2 = cordY;
                        }
                    }
                });

                if (x1 < cameraWidth / 6.0 || x1 > cameraWidth * 5 / 6 || y1 < cameraHeight / 6 || y1 > cameraHeight * 5 / 6 ||
                    x2 < cameraWidth / 6.0 || x2 > cameraWidth * 5 / 6 || y2 < cameraHeight / 6 || y2 > cameraHeight * 5 / 6) {
                    drawBorder(context, windowWidth, windowHeight, "red");
                } else {
                    drawBorder(context, windowWidth, windowHeight, "green");
                }

                let scale = Math.max(Math.ceil(x2) - Math.ceil(x1), Math.ceil(y2) - Math.ceil(y1) / (videoWidth / 4));

                if (scale < 1.9 || scale > 2.1) {
                    drawBorder(context, windowWidth, windowHeight, "red");
                    // console.log("Ortada turing")
                }

                results.facialTransformationMatrixes.forEach((element) => {
                    const matrix = [
                        element.data[0], element.data[1], element.data[2],
                        element.data[4], element.data[5], element.data[6],
                        element.data[8], element.data[9], element.data[10],
                    ];
                    const rodriguesVector = rodriguesRotationVectorFromMatrix(matrix);

                    let pitch = rodriguesVector[0];
                    let yaw = rodriguesVector[1];
                    let roll = rodriguesVector[2];

                    if (yaw < -7) {
                        drawBorder(context, windowWidth, windowHeight, "red");
                        // success = false;
                    } else if (yaw > 7) {
                        drawBorder(context, windowWidth, windowHeight, "red");
                        // success = false;
                    } else if (pitch < -7) {
                        drawBorder(context, windowWidth, windowHeight, "red");
                        // success = false;
                    } else if (pitch > 7) {
                        drawBorder(context, windowWidth, windowHeight, "red");
                        // success = false;
                    } else if (roll < -7) {
                        drawBorder(context, windowWidth, windowHeight, "red");
                        // success = false;
                    } else if (roll > 7) {
                        drawBorder(context, windowWidth, windowHeight, "red");
                        // success = false;
                    } else {
                        // success = true;
                        drawBorder(context, windowWidth, windowHeight, "green");
                        centerText.value = "3 soniya to'g'riga qarab turing";
                        setTimeout(() => {
                            if (status !== true) {
                                status = true;
                                process.value = false;
                                isLoading.value = true;
                                console.log("shirq", status);
                                send();
                            }
                        }, 3000);
                    }
                });
            } else if (results.faceLandmarks.length >= 2) {
                drawBorder(context, windowWidth, windowHeight, "orange");
                centerText.value = "1 tadan ko'p odam aniqlandi";
            } else {
                drawBorder(context, windowWidth, windowHeight, "yellow");
                centerText.value = "Odam aniqlanmadi. Kameraga qarang";
            }
        } else {
        }

        if (process.value) {
            window.requestAnimationFrame(predictWebcam);
        } else {
            video.pause;
            if (video.srcObject) {
                // @ts-ignore
                video.srcObject.getTracks()[0].stop();
            }
        }
    }


    watch(process, () => {
        if (process.value) {
            window.requestAnimationFrame(predictWebcam);
        } else {
            video.pause;
            if (video.srcObject) {
                // @ts-ignore
                video.srcObject.getTracks()[0].stop();
            }
        }
    });

});

</script>

<template>
    <div class="">
        <div class="fixed top-0 left-0 w-full h-full flex flex-col items-center justify-center z-[-1]">
            <p :class="'text-' + color + '-500'" class="text-3xl font-bold text-center">{{ centerText }}</p>
        </div>
        <Button v-if="reload" @click="reloadFunc" class="fixed bottom-10 left-[40%] z-50">Qayta urinish</Button>
        <canvas id="canvas" class="fixed top-0 left-0 w-full h-full z-[-1]"></canvas>
        <canvas id="photo" style="display: none;"></canvas>
        <video id="video" class="fixed top-0 left-0 w-full h-full -z-10" autoplay playsinline loop></video>
    </div>
    <div :class="isLoading ? 'flex' : 'hidden'"
        class="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-accent/70">
        <LucideRefreshCw class="animate-spin" :size="50" />
    </div>
</template>

<style>
video {
    transform: rotateY(180deg);
    -webkit-transform: rotateY(180deg);
    -moz-transform: rotateY(180deg);
    object-fit: cover;
}
</style>