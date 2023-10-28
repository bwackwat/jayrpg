import * as THREE from 'three';

export default class JayState {
    static controlScheme = 1;
    static keys = {};
    static leftMouseDown = false;
    static rightMouseDown = false;
    static controlKey = false;
    static jump = false;
    static doubleJump = false;
    static yVelocity = 0.0;
    static yOffset = 0.0;

    static pointerLocked = false;
    static mouseX = 0.0;
    static mouseY = 0.0;

    static renderer = null;
    static scene = null;
    static camera = null;
    static sky = null;
    static sprites = [];

    static pointerControls = null;
    static orbitControls = null;
    static lastPosition = new THREE.Vector3(0.0, 0.0, 0.0);
    static horizontalCameraAngle = 0.0;
    static verticalCameraAngle = 0.0;
    static cameraZoom = 40.0;
    static cameraZoomStep = 2.0;
    static minZoom = 10.0;
    static maxZoom = 80.0;
    static noClipping = false;
    
    static {
        // console.log("State initialized.");
    }

    static message = function(msg) {
        const e = document.createElement('div');
        e.className = 'chat-text chat-text-server';
        e.innerText += msg;
        const chatElement = document.getElementById('chat-ui-text-area');
        chatElement.insertBefore(e, document.getElementById('chat-input'));
    }
}
