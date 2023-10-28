import * as THREE from 'three';

import {entity} from './entity.js';
import {finite_state_machine} from './finite-state-machine.js';
import {player_state} from './player-state.js';
import JayState from './state.js';

import {defs} from '/shared/defs.mjs';


export const player_entity = (() => {

  class CharacterFSM extends finite_state_machine.FiniteStateMachine {
    constructor(proxy) {
      super();
      this._proxy = proxy;
      this.Init_();
    }
  
    Init_() {
      this._AddState('idle', player_state.IdleState);
      this._AddState('walk', player_state.WalkState);
      this._AddState('run', player_state.RunState);
      this._AddState('attack', player_state.AttackState);
      this._AddState('death', player_state.DeathState);
      this._AddState('dance', player_state.DanceState);
    }
  };
  
  class BasicCharacterControllerProxy {
    constructor(animations) {
      this.animations_ = animations;
    }
  
    get animations() {
      return this.animations_;
    }
  };

  class BasicCharacterController extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    InitEntity() {
      this.Init_();
    }

    Init_() {
      this.decceleration_ = new THREE.Vector3(-5.0, -0.0001, -5.0);
      this.acceleration_ = new THREE.Vector3(60.0, 0.125, 60.0);
      // this.decceleration_ = new THREE.Vector3(-0.0005, -0.0001, -5.0);
      // this.acceleration_ = new THREE.Vector3(1, 0.125, 100.0);
      this.velocity_ = new THREE.Vector3(0, 0, 0);
      this.group_ = new THREE.Group();

      this.facing = 0.0;

      JayState.scene.add(this.group_);

      this.animations_ = {};
  
      this.LoadModels_();
    }

    InitComponent() {
      this._RegisterHandler('health.death', (m) => { this.OnDeath_(m); });
      this._RegisterHandler(
          'update.position', (m) => { this.OnUpdatePosition_(m); });
      this._RegisterHandler(
          'update.rotation', (m) => { this.OnUpdateRotation_(m); });
    }

    OnUpdatePosition_(msg) {
      this.group_.position.copy(msg.value);
    }

    OnUpdateRotation_(msg) {
      this.group_.quaternion.copy(msg.value);
    }

    OnDeath_(msg) {
      this.stateMachine_.SetState('death');
    }

    LoadModels_() {
      const classType = this.params_.desc.character.class;
      const modelData = defs.CHARACTER_MODELS[classType];

      const loader = this.FindEntity('loader').GetComponent('LoadController');
      loader.LoadSkinnedGLB(modelData.path, modelData.base, (glb) => {
        this.target_ = glb.scene;
        this.target_.scale.setScalar(modelData.scale);
        this.target_.visible = false;

        this.group_.add(this.target_);
  
        this.bones_ = {};
        this.target_.traverse(c => {
          if (!c.skeleton) {
            return;
          }
          for (let b of c.skeleton.bones) {
            this.bones_[b.name] = b;
          }
        });

        this.target_.traverse(c => {
          c.castShadow = true;
          c.receiveShadow = true;
          if (c.material && c.material.map) {
            c.material.map.encoding = THREE.sRGBEncoding;
          }
        });

        this._mixer = new THREE.AnimationMixer(this.target_);

        const _FindAnim = (animName) => {
          for (let i = 0; i < glb.animations.length; i++) {
            if (glb.animations[i].name.includes(animName)) {
              const clip = glb.animations[i];
              const action = this._mixer.clipAction(clip);
              return {
                clip: clip,
                action: action
              }
            }
          }
          return null;
        };

        this.animations_['idle'] = _FindAnim('Idle');
        this.animations_['walk'] = _FindAnim('Walk');
        this.animations_['run'] = _FindAnim('Run');
        this.animations_['death'] = _FindAnim('Death');
        this.animations_['attack'] = _FindAnim('Attack');
        this.animations_['dance'] = _FindAnim('Dance');

        this.target_.visible = true;

        this.stateMachine_ = new CharacterFSM(
            new BasicCharacterControllerProxy(this.animations_));

        this.stateMachine_.SetState('idle');

        this.Broadcast({
            topic: 'load.character',
            model: this.target_,
            bones: this.bones_,
        });

        this.FindEntity('ui').GetComponent('UIController').FadeoutLogin();
      });
    }

    _FindIntersections(pos, oldPos) {
      const _IsAlive = (c) => {
        const h = c.entity.GetComponent('HealthComponent');
        if (!h) {
          return true;
        }
        return h.Health > 0;
      };

      const grid = this.GetComponent('SpatialGridController');
      const nearby = grid.FindNearbyEntities(5).filter(e => _IsAlive(e));
      const collisions = [];

      for (let i = 0; i < nearby.length; ++i) {
        const e = nearby[i].entity;
        const d = ((pos.x - e.Position.x) ** 2 + (pos.z - e.Position.z) ** 2) ** 0.5;

        // HARDCODED
        if (d <= 4) {
          const d2 = ((oldPos.x - e.Position.x) ** 2 + (oldPos.z - e.Position.z) ** 2) ** 0.5;

          // If they're already colliding, let them get untangled.
          if (d2 <= 4) {
            continue;
          } else {
            collisions.push(nearby[i].entity);
          }
        }
      }
      return collisions;
    }

    Update(timeInSeconds) {
      if (!this.stateMachine_) {
        return;
      }

      const input = this.GetComponent('BasicCharacterControllerInput');
      this.stateMachine_.Update(timeInSeconds, input);

      if (this._mixer) {
        this._mixer.update(timeInSeconds);
      }

      // HARDCODED
      this.Broadcast({
          topic: 'player.action',
          action: this.stateMachine_._currentState.Name,
      });

      let pos = null;
      const controlObject = this.group_;

      if(JayState.noClipping){
        let speed = input._keys.shift ? 10.0 : 0.5;

        pos = controlObject.position.clone()
        let forwardOffsetX = Math.sin(JayState.horizontalCameraAngle) * Math.cos(JayState.verticalCameraAngle + Math.PI) * speed;
        let forwardOffsetZ = Math.cos(JayState.horizontalCameraAngle) * Math.cos(JayState.verticalCameraAngle + Math.PI) * speed;
        let forwardOffsetY = Math.sin(JayState.verticalCameraAngle + Math.PI) * speed;
        let sideOffsetX = Math.sin(JayState.horizontalCameraAngle - Math.PI / 2) * speed;
        let sideOffsetZ = Math.cos(JayState.horizontalCameraAngle + Math.PI / 2) * speed;
        
        if (input._keys.forward) {
          pos.x += forwardOffsetX;
          pos.y += forwardOffsetY;
          pos.z += forwardOffsetZ;
        }
        if (input._keys.backward) {
          pos.x -= forwardOffsetX;
          pos.y -= forwardOffsetY;
          pos.z -= forwardOffsetZ;
        }
        if (input._keys.left) {
          pos.x += sideOffsetX;
          pos.z += sideOffsetZ;
        }
        if (input._keys.right) {
          pos.x -= sideOffsetX;
          pos.z -= sideOffsetZ;
        }
        if (input._keys.space) {
          pos.y += speed;
        }
        if (JayState.controlKey) {
          pos.y -= speed;
        }

        // let inverseQuaternion = new THREE.Quaternion();
        // inverseQuaternion.setFromEuler(new THREE.Euler(JayState.verticalCameraAngle + Math.PI, JayState.horizontalCameraAngle + Math.PI, 0));

        // inverseQuaternion.setFromEuler(new THREE.Euler(JayState.verticalCameraAngle + Math.PI, 0, JayState.horizontalCameraAngle + Math.PI));
        // let inverseQuaternion = JayState.camera.quaternion.clone();
        // inverseQuaternion.normalize();

        // let inverseQuaternion = this.Parent.rotation.clone();
        // this.Parent.SetQuaternion(JayState.camera.quaternion);

        let inverseQuaternion = new THREE.Quaternion();
        inverseQuaternion._x = -JayState.camera.quaternion._x;
        inverseQuaternion._y = -JayState.camera.quaternion._y;
        inverseQuaternion._z = -JayState.camera.quaternion._z;
        inverseQuaternion._w = -JayState.camera.quaternion._w;
        this.Parent.SetQuaternion(inverseQuaternion);


        // if (input._keys.forward) {
        //   pos.x += speed;
        // }
        // if (input._keys.backward) {
        //   pos.x -= speed;
        // }
        // if (input._keys.left) {
        //   pos.z += speed;
        // }
        // if (input._keys.right) {
        //   pos.z -= speed;
        // }
        // if (input._keys.space) {
        //   pos.y += speed;
        // }
        // if (JayState.controlKey) {
        //   pos.y -= speed;
        // }
      }else{
        const currentState = this.stateMachine_._currentState;
        if (currentState.Name != 'walk' &&
            currentState.Name != 'run' &&
            currentState.Name != 'idle') {
          return;
        }
      
        const velocity = this.velocity_;
        const frameDecceleration = new THREE.Vector3(
            velocity.x * this.decceleration_.x,
            velocity.y * this.decceleration_.y,
            velocity.z * this.decceleration_.z
        );
        frameDecceleration.multiplyScalar(timeInSeconds);
        frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
            Math.abs(frameDecceleration.z), Math.abs(velocity.z));
        
        frameDecceleration.x = Math.sign(frameDecceleration.x) * Math.min(
          Math.abs(frameDecceleration.x), Math.abs(velocity.x));
    
        velocity.add(frameDecceleration);
    
        const _Q = new THREE.Quaternion();
        const _A = new THREE.Vector3();
        const _R = controlObject.quaternion.clone();
        
        let rotation = controlObject.quaternion.clone();
    
        const acc = this.acceleration_.clone();
        if (input._keys.shift) {
          acc.multiplyScalar(2.0);
        }

        if (JayState.controlScheme == 0){
          if (input._keys.forward) {
            velocity.z += acc.z * timeInSeconds;
          }
          if (input._keys.backward) {
            velocity.z -= acc.z * timeInSeconds;
          }

          if (input._keys.left) {
            _A.set(0, 1, 0);
            _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this.acceleration_.y);
            _R.multiply(_Q);
          }
          if (input._keys.right) {
            _A.set(0, 1, 0);
            _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this.acceleration_.y);
            _R.multiply(_Q);
          }
        }else{
          _A.set(0, 1, 0);

          if(JayState.rightMouseDown){
            var vector = new THREE.Vector3(); // create once and reuse it!
            JayState.camera.getWorldDirection( vector );
            var theta = Math.atan2(vector.x, vector.z);
            
            this.facing = theta;
            // this.facing = JayState.orbitControls.getAzimuthalAngle() + Math.PI;
          }
          // console.log(this.facing);

          if (input._keys.forward){
            velocity.z += acc.z * timeInSeconds;

            if (input._keys.left){
              // velocity.x += acc.x * timeInSeconds;
              rotation = _Q.setFromAxisAngle(_A, this.facing + Math.PI / 4.0).clone();
            } else if (input._keys.right){
              // velocity.x -= acc.x * timeInSeconds;
              rotation = _Q.setFromAxisAngle(_A, this.facing - Math.PI / 4.0).clone();
            } else {
              rotation = _Q.setFromAxisAngle(_A, this.facing).clone();
            }

          } else if (input._keys.backward){
            velocity.z += acc.z * timeInSeconds;

            if (input._keys.left){
              // velocity.x += acc.x * timeInSeconds;
              rotation = _Q.setFromAxisAngle(_A, this.facing + 3.0 * Math.PI / 4.0).clone();
            } else if (input._keys.right){
              // velocity.x -= acc.x * timeInSeconds;
              rotation = _Q.setFromAxisAngle(_A, this.facing - 3.0 * Math.PI / 4.0).clone();
            }else{
              rotation = _Q.setFromAxisAngle(_A, this.facing + Math.PI).clone();
            }

          } else if (input._keys.left){
            velocity.z += acc.z * timeInSeconds;
            
            // velocity.x += acc.x * timeInSeconds;
            rotation = _Q.setFromAxisAngle(_A, this.facing + Math.PI / 2.0).clone();
          } else if (input._keys.right){
            velocity.z += acc.z * timeInSeconds;

            // velocity.x -= acc.x * timeInSeconds;
            rotation = _Q.setFromAxisAngle(_A, this.facing - Math.PI / 2.0).clone();
          }
        }
    
        controlObject.quaternion.copy(_R);
    
        const oldPosition = new THREE.Vector3();
        oldPosition.copy(controlObject.position);
    
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(controlObject.quaternion);
        forward.normalize();
    
        // const sideways = new THREE.Vector3(1, 0, 0);
        // sideways.applyQuaternion(controlObject.quaternion);
        // sideways.normalize();
    
        // sideways.multiplyScalar(velocity.x * timeInSeconds);
        forward.multiplyScalar(velocity.z * timeInSeconds);
    
        pos = controlObject.position.clone();
        pos.add(forward);
        // pos.add(sideways);

        const collisions = this._FindIntersections(pos, oldPosition);
        if (collisions.length > 0) {
          return;
        }

        // const terrain = this.FindEntity('terrain').GetComponent('TerrainChunkManager');
        const terrainHeight = JayState.terrain.GetHeight(pos)[0]
        pos.y = terrainHeight;

        if (JayState.keys[32] && !JayState.jump && JayState.yVelocity === 0.0){
          JayState.jump = true;
          JayState.yVelocity = 1.6;
          this.stateMachine_.SetState('run');
        }
        if (JayState.jump){
          JayState.yVelocity -= 0.2;
        }
        if (JayState.yOffset < 0.0){
          JayState.yVelocity = 0.0;
          JayState.yOffset = 0.0;
          JayState.jump = false;
        }
        JayState.yOffset += JayState.yVelocity;
        pos.y += JayState.yOffset;
        if (pos.y < terrainHeight) {
          pos.y = terrainHeight;
        }
        
        if (JayState.controlScheme == 0){
          this.Parent.SetQuaternion(controlObject.quaternion);
        }else{
          this.Parent.SetQuaternion(rotation);
        }
      }

      JayState.lastPosition = pos.clone();
      let x = JayState.lastPosition.x + Math.sin( JayState.horizontalCameraAngle ) * JayState.cameraZoom;
      let z = JayState.lastPosition.z + Math.cos( JayState.horizontalCameraAngle ) * JayState.cameraZoom;
      let y = 0;
      if(JayState.noClipping){
        y = JayState.lastPosition.y + Math.sin(JayState.verticalCameraAngle) * JayState.cameraZoom;
      }else{
        y = JayState.lastPosition.y + JayState.terrain.GetHeight(JayState.camera.position)[0] + 20;
      }
      JayState.camera.position.set( x, y, z );
      JayState.camera.lookAt(JayState.lastPosition);

      controlObject.position.copy(pos);
      JayState.sky.position.copy(pos);
      this.Parent.SetPosition(controlObject.position);

      for (let i = 0; i < JayState.sprites.length; i++) {
        JayState.sprites[i].lookAt(JayState.camera.position);
      }
    }
  };
  
  return {
      CharacterFSM: CharacterFSM,
      BasicCharacterControllerProxy: BasicCharacterControllerProxy,
      BasicCharacterController: BasicCharacterController,
  };
})();
