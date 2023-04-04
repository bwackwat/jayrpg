import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import {entity} from './entity.js';

import JayState from './state.js';

export const third_person_camera = (() => {
  
  class ThirdPersonCamera extends entity.Component {
    constructor(params) {
      super();

      this._params = params;
      this._camera = params.camera;

      this._currentPosition = new THREE.Vector3();
      this._currentLookat = new THREE.Vector3();
    }

    _CalculateIdealOffset() {
      const zoom = 5.0;
      const idealOffset = new THREE.Vector3(0.0, 10.0 * zoom, -15.0 * zoom);

      // idealOffset.applyQuaternion(this._params.target._rotation);
      idealOffset.add(this._params.target._position);

      const terrain = this.FindEntity('terrain').GetComponent('TerrainChunkManager');
      idealOffset.y = Math.max(idealOffset.y, terrain.GetHeight(idealOffset)[0] + 5.0);

      return idealOffset;
    }

    _CalculateIdealLookat() {
      const idealLookat = new THREE.Vector3(0, 5, 20);
      // idealLookat.applyQuaternion(this._params.target._rotation);
      idealLookat.add(this._params.target._position);
      return idealLookat;
    }

    Update(timeElapsed) {
      const idealOffset = this._CalculateIdealOffset();
      const idealLookat = this._CalculateIdealLookat();

      // const t = 0.05;
      // const t = 4.0 * timeElapsed;
      const t = 1.0 - Math.pow(0.01, timeElapsed);

      this._currentPosition.lerp(idealOffset, t);
      this._currentLookat.lerp(idealLookat, t);

      this._camera.position.copy(this._currentPosition);
      this._camera.lookAt(this._currentLookat);
    }
  }

  return {
    ThirdPersonCamera: ThirdPersonCamera
  };

})();