// import { GUI } from 'https://cdn.jsdelivr.net/npm/three@0.151.3/examples/jsm/libs/dat.gui.module.js';
import { GUI } from 'https://cdn.jsdelivr.net/npm/three@0.151.3/examples/jsm/libs/lil-gui.module.min.js';

import { entity_manager } from './entity-manager.js';
import { entity } from './entity.js';
import { ui_controller } from './ui-controller.js';
import { level_up_component } from './level-up-component.js';
import { network_controller } from './network-controller.js';
import { scenery_controller } from './scenery-controller.js';
import { load_controller } from './load-controller.js';
import { spawners } from './spawners.js';
import { terrain } from './terrain.js';
import { inventory_controller } from './inventory-controller.js';

import { spatial_hash_grid } from '/shared/spatial-hash-grid.mjs';
import { defs } from '/shared/defs.mjs';
import { threejs_component } from './threejs_component.js';
import JayState from './state.js';


class CrappyMMOAttempt {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this.entityManager_ = new entity_manager.EntityManager();

    document.getElementById('login-ui').style.visibility = 'visible';
    document.getElementById('login-button').onclick = () => {
      this.OnGameStarted_();
    };
  }

  OnGameStarted_() {
    this.CreateGUI_();

    this.grid_ = new spatial_hash_grid.SpatialHashGrid(
      [[-1000, -1000], [1000, 1000]], [100, 100]);

    this.LoadControllers_();
    this.LoadPlayer_();

    this.previousRAF_ = null;
    this.RAF_();
  }

  CreateGUI_() {
    this._guiParams = {
      general: {
        alternate_controls: JayState.controlScheme == 1
      },
    };
    this._gui = new GUI();

    const generalRollup = this._gui.addFolder('General');
    generalRollup.add(this._guiParams.general, "alternate_controls").onChange(() => {
      if (this._guiParams.general.alternate_controls) {
        JayState.controlScheme = 1;
      } else {
        JayState.controlScheme = 0;
      }
    });
    this._gui.close();
  }

  LoadControllers_() {
    const threejs = new entity.Entity();
    threejs.AddComponent(new threejs_component.ThreeJSController());
    this.entityManager_.Add(threejs);

    const ui = new entity.Entity();
    ui.AddComponent(new ui_controller.UIController());
    this.entityManager_.Add(ui, 'ui');

    const network = new entity.Entity();
    network.AddComponent(new network_controller.NetworkController());
    this.entityManager_.Add(network, 'network');

    const t = new entity.Entity();
    JayState.terrain = new terrain.TerrainChunkManager({
      target: 'player',
      gui: this._gui,
      guiParams: this._guiParams
    });
    t.AddComponent(JayState.terrain);
    this.entityManager_.Add(t, 'terrain');

    const l = new entity.Entity();
    l.AddComponent(new load_controller.LoadController());
    this.entityManager_.Add(l, 'loader');

    const scenery = new entity.Entity();
    scenery.AddComponent(new scenery_controller.SceneryController({
      grid: this.grid_,
    }));
    this.entityManager_.Add(scenery, 'scenery');

    const spawner = new entity.Entity();
    spawner.AddComponent(new spawners.PlayerSpawner({
      grid: this.grid_,
    }));
    spawner.AddComponent(new spawners.NetworkEntitySpawner({
      grid: this.grid_,
    }));
    this.entityManager_.Add(spawner, 'spawners');


    const database = new entity.Entity();
    database.AddComponent(new inventory_controller.InventoryDatabaseController());
    this.entityManager_.Add(database, 'database');

    // HACK
    for (let k in defs.WEAPONS_DATA) {
      database.GetComponent('InventoryDatabaseController').AddItem(
        k, defs.WEAPONS_DATA[k]);
    }
  }

  LoadPlayer_() {
    const levelUpSpawner = new entity.Entity();
    levelUpSpawner.AddComponent(new level_up_component.LevelUpComponentSpawner({}));
    this.entityManager_.Add(levelUpSpawner, 'level-up-spawner');
  }

  RAF_() {
    requestAnimationFrame((t) => {
      if (this.previousRAF_ === null) {
        this.previousRAF_ = t;
      }

      JayState.renderer.render(JayState.scene, JayState.camera);
      this.Step_(t - this.previousRAF_);
      this.previousRAF_ = t;

      setTimeout(() => {
        this.RAF_();
      }, 1);
    });
  }

  Step_(timeElapsed) {
    const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);

    this.entityManager_.Update(timeElapsedS);
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new CrappyMMOAttempt();
});
