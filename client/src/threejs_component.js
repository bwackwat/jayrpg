import * as THREE from 'three';

// import { MOUSE } from 'three';
// import { TrackballControls } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/controls/TrackballControls.js';
// import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/controls/PointerLockControls.js';
// import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/controls/OrbitControls.js';

import { entity } from "./entity.js";

import JayState from './state.js';

export const threejs_component = (() => {
  const _VS = `
  varying vec3 vWorldPosition;
  
  void main() {
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;
  
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }`;

  const _FS = `
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  uniform float offset;
  uniform float exponent;
  uniform samplerCube background;
  
  varying vec3 vWorldPosition;
  
  void main() {
    vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
    vec3 stars = textureCube(background, viewDirection).xyz;
  
    float h = normalize(vWorldPosition + offset).y;
    float t = max(pow(max(h, 0.0), exponent), 0.0);
  
    float f = exp(min(0.0, -vWorldPosition.y * 0.00125));
  
    vec3 sky = mix(stars, bottomColor, f);
    gl_FragColor = vec4(sky, 1.0);
  }`;

  class ThreeJSController extends entity.Component {
    constructor() {
      super();
    }

    _OnWindowResize() {
      JayState.camera.aspect = window.innerWidth / window.innerHeight;
      JayState.camera.updateProjectionMatrix();
      // this.threejs_.setSize(window.innerWidth, window.innerHeight);
      JayState.renderer.setSize(window.innerWidth, window.innerHeight);
      // JayState.orbitControls.handleResize();
    }

    InitEntity() {
      THREE.ShaderChunk.fog_fragment = `
      #ifdef USE_FOG
        vec3 fogOrigin = cameraPosition;
        vec3 fogDirection = normalize(vWorldPosition - fogOrigin);
        float fogDepth = distance(vWorldPosition, fogOrigin);
  
        fogDepth *= fogDepth;
  
        float heightFactor = 0.05;
        float fogFactor = heightFactor * exp(-fogOrigin.y * fogDensity) * (
            1.0 - exp(-fogDepth * fogDirection.y * fogDensity)) / fogDirection.y;
        fogFactor = saturate(fogFactor);
  
        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
      #endif`;

      THREE.ShaderChunk.fog_pars_fragment = `
      #ifdef USE_FOG
        uniform float fogTime;
        uniform vec3 fogColor;
        varying vec3 vWorldPosition;
        #ifdef FOG_EXP2
          uniform float fogDensity;
        #else
          uniform float fogNear;
          uniform float fogFar;
        #endif
      #endif`;

      THREE.ShaderChunk.fog_vertex = `
      #ifdef USE_FOG
        vWorldPosition = (modelMatrix * vec4(transformed, 1.0 )).xyz;
      #endif`;

      THREE.ShaderChunk.fog_pars_vertex = `
      #ifdef USE_FOG
        varying vec3 vWorldPosition;
      #endif`;

      JayState.renderer = new THREE.WebGLRenderer({
        antialias: false,
      });
      JayState.renderer.outputEncoding = THREE.sRGBEncoding;
      JayState.renderer.gammaFactor = 2.2;
      JayState.renderer.shadowMap.enabled = true;
      JayState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      JayState.renderer.setPixelRatio(window.devicePixelRatio);
      JayState.renderer.domElement.id = 'threejs';

      document.getElementById('container').appendChild(JayState.renderer.domElement);

      window.addEventListener('resize', () => {
        this._OnWindowResize();
      }, false);

      const fov = 60;
      const aspect = 1920 / 1080;
      const near = 1.0;
      const far = 10000.0;
      JayState.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      this._OnWindowResize();
      JayState.camera.position.set(25, 10, 25);
      
      // JayState.orbitControls = new OrbitControls(JayState.camera, document.body);
      // JayState.orbitControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
      // JayState.orbitControls.dampingFactor = 0.1;

      // JayState.orbitControls.enablePan = false;
      // JayState.orbitControls.enableKeys = false;

      // JayState.orbitControls.minDistance = 10;
      // JayState.orbitControls.maxDistance = 50;

      // JayState.orbitControls.maxPolarAngle = Math.PI / 2;

      // JayState.orbitControls.mouseButtons = { LEFT: MOUSE.NONE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE };

      function moveCallback(event) {
        if (JayState.rightMouseDown) {
            // var deltaX = event.clientX - JayState.mouseX;
            // var deltaY = event.clientY - JayState.mouseY;

            // mesh.rotation.y += deltaX / 100;
            // mesh.rotation.x += deltaY / 100;
            // console.log(deltaX, deltaY);
            // console.log(event.movementX, event.movementY);

            // JayState.camera.position.applyQuaternion(
            //   new THREE.Quaternion().setFromAxisAngle(
            //     new THREE.Vector3(0, 1, 0),
            //     // The positive y-axis
            //     Math.PI / 200.0 * event.movementX // The amount of rotation to apply this time
            //   )
            // );
            JayState.cameraAngle -= Math.PI / 2000.0 * event.movementX;
            
            var x = JayState.lastPosition.x + Math.sin( JayState.cameraAngle ) * 40.0;
            var z = JayState.lastPosition.z + Math.cos( JayState.cameraAngle ) * 40.0;
            let y = JayState.terrain.GetHeight(JayState.camera.position)[0] + 20;

            JayState.camera.position.set( x, y, z );
            JayState.camera.lookAt(JayState.lastPosition);
        }

        // JayState.mouseX = event.clientX;
        // JayState.mouseY = event.clientY;
      }

      document.addEventListener('pointerlockchange', function () {
        if (document.pointerLockElement === document.body ||
            document.mozPointerLockElement === document.body) {
          // console.log('The pointer lock status is now locked');
          // JayState.message('Locked');
          JayState.pointerLocked = true;
          document.body.addEventListener("mousemove", moveCallback, true);
        } else {
          // console.log('The pointer lock status is now unlocked');
          JayState.pointerLocked = false;
          document.body.removeEventListener("mousemove", moveCallback, true);
        }
      }, false)

      document.body.addEventListener('click', function () {
        if(!JayState.pointerLocked){
          document.body.requestPointerLock();
        }
        if (typeof(JayState.renderer.domElement) !== 'undefined') {
          if(window.innerWidth !== screen.width || window.innerHeight !== screen.height){
            document.body.requestFullscreen();
          }
        }
      }, false);

      // JayState.renderer.domElement.addEventListener("mousemove", function(event) {
      //   // if (mouseDown) {
      //       var deltaX = event.clientX - JayState.mouseX;
      //       var deltaY = event.clientY - JayState.mouseY;

      //       // mesh.rotation.y += deltaX / 100;
      //       // mesh.rotation.x += deltaY / 100;
      //   // }

      //   JayState.mouseX = event.clientX;
      //   JayState.mouseY = event.clientY;
      // });
      
      // controls.addEventListener('lock', function () {
      //     // ...
      // });
      // controls.addEventListener('unlock', function () {
      //     // ...
      // });
      // controls.addEventListener('drag', function (event) {
      //     var distance = event.distance;
      //     console.log(distance);
      // });

      this.scene_ = new THREE.Scene();
      this.scene_.fog = new THREE.FogExp2(0x89b2eb, 0.00002);

      let light = new THREE.DirectionalLight(0x8088b3, 0.7);
      light.position.set(-10, 500, 10);
      light.target.position.set(0, 0, 0);
      light.castShadow = true;
      light.shadow.bias = -0.001;
      light.shadow.mapSize.width = 4096;
      light.shadow.mapSize.height = 4096;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 1000.0;
      light.shadow.camera.left = 100;
      light.shadow.camera.right = -100;
      light.shadow.camera.top = 100;
      light.shadow.camera.bottom = -100;
      this.scene_.add(light);

      this.sun_ = light;

      this.LoadSky_();
    }

    LoadSky_() {
      const hemiLight = new THREE.HemisphereLight(0x424a75, 0x6a88b5, 0.7);
      // hemiLight.color.setHSL(0.6, 1, 0.4);
      // hemiLight.groundColor.setHSL(0.095, 1, 0.5);
      this.scene_.add(hemiLight);


      const loader = new THREE.CubeTextureLoader();
      const texture = loader.load([
        './resources/terrain/space-posx.jpg',
        './resources/terrain/space-negx.jpg',
        './resources/terrain/space-posy.jpg',
        './resources/terrain/space-negy.jpg',
        './resources/terrain/space-posz.jpg',
        './resources/terrain/space-negz.jpg',
      ]);
      texture.encoding = THREE.sRGBEncoding;

      const uniforms = {
        "topColor": { value: new THREE.Color(0x000000) },
        "bottomColor": { value: new THREE.Color(0x5d679e) },
        "offset": { value: -500 },
        "exponent": { value: 0.3 },
        "background": { value: texture },
      };
      // uniforms["topColor"].value.copy(hemiLight.color);

      this.scene_.fog.color.copy(uniforms["bottomColor"].value);

      const skyGeo = new THREE.SphereBufferGeometry(5000, 32, 15);
      const skyMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: _VS,
        fragmentShader: _FS,
        side: THREE.BackSide
      });

      const sky = new THREE.Mesh(skyGeo, skyMat);
      this.scene_.add(sky);
    }

    Update(_) {
      const player = this.FindEntity('player');
      if (!player) {
        return;
      }
      const pos = player._position;

      this.sun_.position.copy(pos);
      this.sun_.position.add(new THREE.Vector3(-50, 200, -10));
      this.sun_.target.position.copy(pos);
      this.sun_.updateMatrixWorld();
      this.sun_.target.updateMatrixWorld();
    }
  }

  return {
    ThreeJSController: ThreeJSController,
  };
})();