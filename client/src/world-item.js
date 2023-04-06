import * as THREE from 'three';

import JayState from './state.js';

class WorldItem {
    constructor(x, z) {
        this.material = new THREE.ShaderMaterial({
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });
        this.geometry = new THREE.BoxGeometry(1, 1, 1);
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.mesh.position.set(
            x,
            JayState.terrain.GetHeight(new THREE.Vector3(x, 0, z))[0],
            z
        );
        this.mesh.lookAt(JayState.camera.position);

        JayState.scene.add(this.mesh);
    }
}

class HealthPowerup extends WorldItem {
    constructor(x, z) {
        this.vertexShader = `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        this.fragmentShader = `
            varying vec3 vNormal;
            void main() {
                vec3 light = vec3(0.5, 0.2, 1.0);
                light = normalize(light);
                float dProd = max(0.0, dot(vNormal, light));
                gl_FragColor = vec4(dProd, dProd, dProd, 1.0);
            }
        `

        super(x, z);
    }
}

export {
    WorldItem,
    HealthPowerup,
}