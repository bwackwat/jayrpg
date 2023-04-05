import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

export default class JayState {
    static controlScheme = 1;
    static keys = {};
    static leftMouseDown = false;
    static rightMouseDown = false;
    static jump = false;
    static doubleJump = false;
    static yVelocity = 0.0;
    static yOffset = 0.0;

    static pointerLocked = false;
    static mouseX = 0.0;
    static mouseY = 0.0;

    static renderer = null;
    static camera = null;
    static pointerControls = null;
    static orbitControls = null;
    static lastPosition = new THREE.Vector3(0.0, 8.0, 0.0);
    static cameraAngle = 0.0;
    
    static {
        console.log("State initialized.");
    }

    static message = function(msg) {
        const e = document.createElement('div');
        e.className = 'chat-text chat-text-server';
        e.innerText += msg;
        const chatElement = document.getElementById('chat-ui-text-area');
        chatElement.insertBefore(e, document.getElementById('chat-input'));
    }
}
