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

(async () => {
    const localVideo = document.getElementById("local-video");
    const buttonArea = document.getElementById("button-area");
    const remoteMediaArea = document.getElementById("remote-media-area");
    const roomNameInput = document.getElementById("room-name");
    // document.getElementById('room-name').value = "a";

    const myId = document.getElementById("my-id");
    const joinButton = document.getElementById("join");
    const leaveButton = document.getElementById("leave");

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

    await me.publish(audio);
    await me.publish(video);

    const subscribeAndAttach = (publication) => {
        if (publication.publisher.id === me.id) return;

        const subscribeButton = document.createElement("button");
        subscribeButton.id = `subscribe-button-${publication.id}`;
        subscribeButton.textContent = `${publication.publisher.id}: ${publication.contentType}`;
        buttonArea.appendChild(subscribeButton);

        subscribeButton.onclick = async () => {
            const { stream } = await me.subscribe(publication.id);

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
            stream.attach(newMedia);
            remoteMediaArea.appendChild(newMedia);
        };
    };

    room.publications.forEach(subscribeAndAttach);
    room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));

    leaveButton.onclick = async () => {
        await me.leave();
        await room.dispose();

        myId.textContent = "";
        buttonArea.replaceChildren();
        remoteMediaArea.replaceChildren();
        room.onStreamUnpublished.add((e) => {
            document.getElementById(`subscribe-button-${e.publication.id}`)?.remove();
            document.getElementById(`media-${e.publication.id}`)?.remove();
        });
        window.location.href="room_in.html";
    };

    

    

})();


