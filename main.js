const { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } = skyway_room;
const token = new SkyWayAuthToken({
    jti: uuidV4(),
    iat: nowInSec(),
    exp: nowInSec() + 60 * 60 * 24,
    scope: {
        app: {
            id: "f5a4825a-6c56-4164-8455-e6e9a9d6bf5c",
            turn: true,
            actions: ["read"],
            channels: [
                {
                    id: "*",
                    name: "*",
                    actions: ["write"],
                    members: [
                        {
                            id: "*",
                            name: "*",
                            actions: ["write"],
                            publication: {
                                actions: ["write"],
                            },
                            subscription: {
                                actions: ["write"],
                            },
                        },
                    ],
                    sfuBots: [
                        {
                            actions: ["write"],
                            forwardings: [
                                {
                                    actions: ["write"],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    },
}).encode("WycaGzghuM+aTaX/MPXfe9gP5ayoc9S47PjyDBm+SB4=");

let camera_flg = true;
let audio_flag = true;

(async () => {
    const localVideo = document.getElementById("local-video");
    const buttonArea = document.getElementById("button-area");
    const remoteMediaArea = document.getElementById("remote-media-area");
    const roomNameInput = document.getElementById("room-name");
    const vd = document.getElementById("vd");
    // document.getElementById('room-name').value = "a";

    const myId = document.getElementById("my-id");
    const joinButton = document.getElementById("join");
    const leaveButton = document.getElementById("leave");
    const cm = document.getElementById('camera');
    const mute = document.getElementById('mute');

    const { audio, video } =
        await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
    video.attach(localVideo);
    await localVideo.play();


    if (roomNameInput.value === "") return;

    const context = await SkyWayContext.Create(token);
    const room = await SkyWayRoom.FindOrCreate(context, {
        type: "sfu",
        name: roomNameInput.value,
    });
    const me = await room.join();

    myId.value = me.id;

    let audio_publ = await me.publish(audio);
    let camera_publ = await me.publish(video);

    const subscribeAndAttach = (publication) => {
        if (publication.publisher.id === me.id) return;

        // const subscribeButton = document.createElement("button");
        // subscribeButton.id = `subscribe-button-${publication.id}-${publication.contentType}`;  
        // subscribeButton.textContent = `${publication.publisher.id}: ${publication.contentType}`;
        // buttonArea.appendChild(subscribeButton);
        video_hyouji();

        async function video_hyouji() {
            // subscribeButton.onclick = async () => {
            const { stream } = await me.subscribe(publication.id);
            console.log(me.subscribe(publication.id));
            let newMedia;
            switch (stream.track.kind) {
                case "video":
                    newMedia = document.createElement("video");
                    newMedia.playsInline = true;
                    newMedia.autoplay = true;
                    break;
                case "audio":
                    newMedia = document.createElement("audio");
                    newMedia.controls = true;
                    newMedia.autoplay = true;
                    break;
                default:
                    return;
            }
            newMedia.id = `media-${publication.id}`;

            let vid = document.createElement("li");
            vid.id = `vd-${publication.id}`;

            stream.attach(newMedia);
            remoteMediaArea.appendChild(vid);
            vid.appendChild(newMedia);

            window_resize();
            // };
        }


    };

    room.publications.forEach(subscribeAndAttach);
    room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));

    leaveButton.onclick = async () => {
        await me.leave();
        await room.dispose();

        myId.textContent = "";
        // buttonArea.replaceChildren();
        remoteMediaArea.replaceChildren();

        leave_room();
    };

    room.onStreamUnpublished.add((e) => {
        document.getElementById(`subscribe-button-${e.publication.id}`)?.remove();
        document.getElementById(`media-${e.publication.id}`)?.remove();
        document.getElementById(`vd-${e.publication.id}`)?.remove();
        window_resize();
    });


    cm.onclick = async () => {
        if (camera_flg == true) {
            await camera_publ.disable();
            camera_flg = false;
            $('#cm').attr('src', 'images/camera.png');
        } else {
            await camera_publ.enable();
            camera_flg = true;
            $('#cm').attr('src', 'images/not_camera.png');
        }
    }

    mute.onclick = async () => {
        if (audio_flag == true) {
            await audio_publ.disable();
            audio_flag = false;
            $('#mic').attr('src', 'images/mic.png');
        } else {
            await audio_publ.enable();
            audio_flag = true;
            $('#mic').attr('src', 'images/mute.png');
        }
    }

})();

function sanka() {
    let num = document.getElementsByTagName('video');
    document.getElementById('sanka').textContent(num + "人");
}

function leave_room() {
    window.location.href = "room_in.html";
}

function video_size(w_height, w_width, b_height, b_width) {
    let video_width = w_width / 2;
    let video_height = b_height;
    const video_num = document.getElementsByTagName('video');

    if ($(window).width() <= 768) {
        if (video_num.length == 1) {
            video_width = b_width;
            video_height = b_height;
        } else if (video_num.length == 2) {
            video_width = w_width;
            video_height = (b_height) / 2;
        }
        $('#remote-media-area').css("display", "block");
        let button_height = w_height - b_height;
        $('.buttons').css("height", button_height + "px");
        $('button').css("height", "60px");
        $('button').css("width", "60px");
        $('.main').css("height", video_height + "px");
    } else {
        if (video_num.length == 1) {
            video_width = b_width;
            video_height = b_height;
        } else if (video_num.length == 2) {
            video_width = w_width / 2;
            video_height = b_height;
        } else if (video_num.length == 3 || video_num.length == 4) {
            video_height = w_height / 2;
            video_width = w_width / 2;
        }
    }

    $('video').css("height", video_height + "px");
    $('video').css("width", video_width + "px");

    $('info').css("height", video_height + "px");
    $('info').css("width", video_width + "px");

    $('li').css("height",video_height + "px");
}

function window_resize() {
    w_height = $(window).height();
    w_width = $(window).width();
    b_height = $('#my_video').height();
    b_width = $('#my_video').width();

    let button_height = w_height - b_height;

    $('.main').css("height", w_height + "px");
    $('.main').css("width", w_width + "px");
    $('.buttons').css("height", button_height + "px");
    $('#remote-media-area').css("height", b_height + "px");

    video_size(w_height, w_width, b_height, b_width);
}

document.addEventListener('DOMContentLoaded', () => {
    window_resize();
});


