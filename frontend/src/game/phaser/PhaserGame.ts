import Phaser from "phaser";
import type { ArenaSnapshot } from "../../shared/types/saveTypes";
import { ArenaScene } from "./scenes/ArenaScene";

export class PhaserGame {
  private game: Phaser.Game;
  private arenaScene: ArenaScene;

  constructor(parent: string | HTMLElement) {
    this.arenaScene = new ArenaScene();
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 960,
      height: 736,
      parent,
      backgroundColor: "#050a12",
      scene: [this.arenaScene]
    });
  }

  updateSnapshot(snapshot: ArenaSnapshot): void {
    this.arenaScene.setSnapshot(snapshot);
  }

  destroy(): void {
    this.game.destroy(true);
  }
}

