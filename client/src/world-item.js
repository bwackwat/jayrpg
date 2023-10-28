import * as THREE from 'three';

import JayState from './state.js';

class WorldItem {
    init(x, z) {
        this.material = new THREE.ShaderMaterial({
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });
        this.geometry = new THREE.BoxGeometry(1, 1, 1);
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.mesh.position.set(
            x,
            JayState.terrain.GetHeight(new THREE.Vector3(x, 0, z))[0] + 20,
            z
        );
        this.mesh.lookAt(JayState.camera.position);

        JayState.scene.add(this.mesh);
    }
}
class HealthPowerup {
    constructor(x, z) {
        let vertexShader = `
            precision mediump float;
            varying vec2 vUv;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
                gl_Position = projectionMatrix * mvPosition;
                vUv = uv;
            }
        `;
//         let fragmentShader = `
// varying vec2 vUv;
// uniform float u_time;

// void main() {
//     vec2 uv = vUv * 2.0 - 1.0; // Transform vUv to range from -1.0 to 1.0
//     float radius = 0.5; // Radius of the circle
//     float dist = length(uv); // Distance from the center

//     // Create a plain red circle with transparency all around it
//     if (dist < radius) {
//         gl_FragColor = vec4(1., 0., 0., 1.);
//     } else {
//         gl_FragColor = vec4(0., 0., 0., 0.);
//     }
// }
// `;

        let fragmentShader = `
            varying vec2 vUv;
            uniform float u_time;

            void main() {
                vec2 uv = vUv * 2.0 - 1.0; // Transform vUv to range from -1.0 to 1.0
                float radius = 0.5; // Radius of the circle
                float dist = length(uv); // Distance from the center

                // Create a smooth gradient for the glow
                float glowWidth = 0.6; // Width of the glow
                float glowStart = radius - glowWidth;
                float glowIntensity = smoothstep(glowStart, radius, dist);

                // Create a plain red circle with transparency all around it
                if (dist < radius) {
                    gl_FragColor = vec4(1., 0., 0., 1.);
                } else {
                    gl_FragColor = vec4(1., 0., 0., 1.0 - glowIntensity);
                }
            }
        `;
        
        let uniforms = {
            u_time: { type: "f", value: 0.0 },
        };

        let material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
        });
        
        this.sprite = new THREE.Sprite(material);
        this.sprite.scale.set(10, 10, 1);

        this.sprite.position.set(
            x,
            JayState.terrain.GetHeight(new THREE.Vector3(x, 0, z))[0] + 20,
            z
        );
        
        JayState.scene.add(this.sprite);
        JayState.sprites.push(this.sprite);
    }
}

export {
    WorldItem,
    HealthPowerup,
}