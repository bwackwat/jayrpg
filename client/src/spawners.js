import {entity} from './entity.js';

import {player_entity} from './player-entity.js'
import {health_component} from './health-component.js';
import {player_input} from './player-input.js';
import {spatial_grid_controller} from './spatial-grid-controller.js';
import {inventory_controller} from './inventory-controller.js';
import {equip_weapon_component} from './equip-weapon-component.js';
import {attack_controller} from './attacker-controller.js';

import {npc_entity} from './npc-entity.js';
import {health_bar} from './health-bar.js';
import {network_entity_controller} from './network-entity-controller.js';
import {network_player_controller} from './network-player-controller.js';
import {floating_name} from './floating-name.js';
import {sorceror_effect} from './sorceror-effect.js';
import {blood_effect} from './blood-effect.js';


export const spawners = (() => {

  class PlayerSpawner extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    Spawn(playerParams) {
      const params = {
        desc: playerParams,
      };

      const player = new entity.Entity();
      player.Account = playerParams.account;
      player.AddComponent(new player_input.BasicCharacterControllerInput(params));
      player.AddComponent(new player_entity.BasicCharacterController(params));
      player.AddComponent(
        new equip_weapon_component.EquipWeapon({desc: playerParams}));
      player.AddComponent(new inventory_controller.UIInventoryController(params));
      player.AddComponent(new inventory_controller.InventoryController(params));
      player.AddComponent(new health_component.HealthComponent({
          updateUI: true,
          health: 1,
          maxHealth: 1,
          strength: 1,
          wisdomness: 1,
          benchpress: 1,
          curl: 1,
          experience: 1,
          level: 1,
          desc: playerParams,
      }));
      player.AddComponent(
          new spatial_grid_controller.SpatialGridController(
              {grid: this.params_.grid}));
      player.AddComponent(
          new attack_controller.AttackController());
      player.AddComponent(
          new network_player_controller.NetworkEntityController({
              target: player}));
      player.AddComponent(new blood_effect.BloodEffect({}));
      if (playerParams.character.class == 'sorceror') {
        player.AddComponent(
            new sorceror_effect.SorcerorEffect(params));
      }
      this.Manager.Add(player, 'player');

      return player;
    }
  };

  class NetworkEntitySpawner extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    Spawn(name, desc) {
      const npc = new entity.Entity();
      npc.Account = desc.account;
      npc.AddComponent(new npc_entity.NPCController({
          desc: desc,
      }));
      npc.AddComponent(
          new health_component.HealthComponent({
              health: 50,
              maxHealth: 50,
              strength: 2,
              wisdomness: 2,
              benchpress: 3,
              curl: 1,
              experience: 0,
              level: 1,
              desc: desc,
          }));
      npc.AddComponent(
          new spatial_grid_controller.SpatialGridController(
              {grid: this.params_.grid}));
      npc.AddComponent(
          new network_entity_controller.NetworkEntityController());
      if (desc.account.name) {
        npc.AddComponent(
            new floating_name.FloatingName({desc: desc}));
      }
      npc.AddComponent(
          new equip_weapon_component.EquipWeapon({desc: desc}));
      npc.AddComponent(new inventory_controller.InventoryController());
      npc.AddComponent(new blood_effect.BloodEffect({}));
      if (desc.character.class == 'sorceror') {
        npc.AddComponent(new sorceror_effect.SorcerorEffect({}));
      }

      this.Manager.Add(npc, name);

      return npc;
    }
  }

  return {
    PlayerSpawner: PlayerSpawner,
    NetworkEntitySpawner: NetworkEntitySpawner,
  };
})();