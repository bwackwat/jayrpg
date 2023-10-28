import * as THREE from 'three';

import {entity} from "./entity.js";

import JayState from './state.js';


export const player_input = (() => {

  class PickableComponent extends entity.Component {
    constructor() {
      super();
    }

    InitComponent() {
    }
  };

  class BasicCharacterControllerInput extends entity.Component {
    constructor(params) {
      super();
      this._params = params;
      this._Init();
      this.lastScrollPosition = 0;
    }
  
    _Init() {
      this._keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        space: false,
        shift: false,
        backspace: false,
      };
      this._raycaster = new THREE.Raycaster();
      document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
      document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
      document.addEventListener('pointerup', (e) => this._onMouseUp(e), false);
      document.addEventListener('pointerdown', (e) => this._onMouseDown(e), false);
      document.addEventListener('wheel', (e) => this._onMouseScroll(e), false);
      // document.addEventListener('blur', function () {
      //   console.log("FOCUS LOST");
      //   this._keys.forward = false;
      //   this._keys.left = false;
      //   this._keys.backward = false;
      //   this._keys.right = false;
      //   this._keys.space = false;
      //   this._keys.shift = false;
      //   this._keys.backspace = false;
      // }, false);
    }

    _onMouseScroll(event) {
      if (event.deltaY < 0) {
         JayState.cameraZoom -= JayState.cameraZoomStep;
         if (JayState.cameraZoom < JayState.minZoom) {
           JayState.cameraZoom = JayState.minZoom;
         }
      } else {
        JayState.cameraZoom += JayState.cameraZoomStep;
        if (JayState.cameraZoom > JayState.maxZoom) {
          JayState.cameraZoom = JayState.maxZoom;
        }
      }
    }

    _onMouseDown(event) {
      if(event.button === 0){
        JayState.leftMouseDown = true;
        // JayState.pointerControls.pointerSpeed = 1.0;
      }else if(event.button === 2){
        JayState.rightMouseDown = true;
      }
      // console.log(JayState.leftMouseDown);
      // console.log(JayState.rightMouseDown);
    }
  
    _onMouseUp(event) {
      // event.preventDefault();

      if(event.button === 0){
        JayState.leftMouseDown = false;

        const rect = document.getElementById('threejs').getBoundingClientRect();
        const pos = {
          x: ((event.clientX - rect.left) / rect.width) * 2  - 1,
          y: ((event.clientY - rect.top ) / rect.height) * -2 + 1,
        };

        this._raycaster.setFromCamera(pos, JayState.camera);

        const pickables = this.Manager.Filter((e) => {
          const p = e.GetComponent('PickableComponent');
          if (!p) {
            return false;
          }
          return e._mesh;
        });

        const ray = new THREE.Ray();
        ray.origin.setFromMatrixPosition(JayState.camera.matrixWorld);
        ray.direction.set(pos.x, pos.y, 0.5).unproject(
          JayState.camera).sub(ray.origin).normalize();

        // hack
        document.getElementById('quest-ui').style.visibility = 'hidden';

        for (let p of pickables) {
          // GOOD ENOUGH
          const box = new THREE.Box3().setFromObject(p._mesh);

          if (ray.intersectsBox(box)) {
            p.Broadcast({
                topic: 'input.picked'
            });
            break;
          }
        }
      }else if(event.button === 2){
        JayState.rightMouseDown = false;
        // JayState.pointerControls.pointerSpeed = 0.0;
      }
      // console.log(JayState.leftMouseDown);
      // console.log(JayState.rightMouseDown);
    }

    _onKeyDown(event) {
      JayState.keys[event.keyCode] = true;

      // if(event.ctrlKey){
      //   JayState.controlKey = false;
      // }

      if (event.keyCode === 9){
        document.exitPointerLock();
      }

      if (event.currentTarget.activeElement != document.body) {
        return;
      }
      switch (event.keyCode) {
        case 87: // w
          this._keys.forward = true;
          break;
        case 65: // a
          this._keys.left = true;
          break;
        case 83: // s
          this._keys.backward = true;
          break;
        case 68: // d
          this._keys.right = true;
          break;
        case 32: // SPACE
          this._keys.space = true;
          break;
        case 16: // SHIFT
          this._keys.shift = true;
          break;
        case 8: // BACKSPACE
          this._keys.backspace = true;
          break;
        case 17: // LEFT CONTROL
          JayState.controlKey = true;
          break;
      }
    }
  
    _onKeyUp(event) {
      JayState.keys[event.keyCode] = false;

      // if(event.ctrlKey){
      //   JayState.controlKey = false;
      // }

      if (event.currentTarget.activeElement != document.body) {
        return;
      }
      switch(event.keyCode) {
        case 87: // w
          this._keys.forward = false;
          break;
        case 65: // a
          this._keys.left = false;
          break;
        case 83: // s
          this._keys.backward = false;
          break;
        case 68: // d
          this._keys.right = false;
          break;
        case 32: // SPACE
          this._keys.space = false;
          break;
        case 16: // SHIFT
          this._keys.shift = false;
          break;
        case 8: // BACKSPACE
          this._keys.backspace = false;
          break;
        case 17: // LEFT CONTROL
          JayState.controlKey = false;
          break;
        case 78: // N
          JayState.noClipping = !JayState.noClipping;
          JayState.message("No clipping: " + JayState.noClipping);
          break;
        default:
          console.log(event.keyCode);
      }
    }
  };

  return {
    BasicCharacterControllerInput: BasicCharacterControllerInput,
    PickableComponent: PickableComponent,
  };

})();
