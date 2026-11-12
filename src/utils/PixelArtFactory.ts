import type Phaser from 'phaser';

export const ASSET_KEYS = {
  tileGrass: 'tile-grass', tileRoad: 'tile-road', tilePath: 'tile-path',
  school: 'school-core', tower: 'tower-base', projectile: 'projectile-dot',
  zombieWalk: 'zombie-normal', zombieAttack: 'zombie-normal', zombieDeath: 'zombie-normal',
  zombieTank: 'zombie-tank', zombieRunner: 'zombie-runner', zombieHealer: 'zombie-healer',
  zombieBoss: 'zombie-boss', coin: 'coin-pixel', heart: 'heart-pixel',
} as const;

const C = {
  outline: '#18243b', dark: '#283b4f', grass: '#344d4a', grass2: '#3f5c52',
  road: '#8b776b', roadLight: '#a18d7d', cream: '#f4e5bd', orange: '#f7a34a',
  yellow: '#ffdc75', green: '#91df78', lime: '#b4f274', purple: '#a58add',
  blue: '#78c8e5', skin: '#b8e58d', white: '#f9f4de', pink: '#f49aaa',
};

function drawPixelArt(scene: Phaser.Scene, key: string, pixels: string[], palette: Record<string, string>, scale = 2): void {
  const width = Math.max(...pixels.map((row) => row.length));
  const height = pixels.length;
  const texture = scene.textures.createCanvas(key, width * scale, height * scale);
  if (!texture) return;
  const context = texture.getContext();
  pixels.forEach((row, y) => {
    [...row].forEach((pixel, x) => {
      const color = palette[pixel];
      if (!color || pixel === '.') return;
      context.fillStyle = color;
      context.fillRect(x * scale, y * scale, scale, scale);
    });
  });
  texture.refresh();
}

const zombieFrames = [
  ['....DD....','...DSSD...','..DSSSSD..','.DSSSSSSD.','.DSSSSSSD.','..DDDDDD..','...D..D...','..DD..DD..','..D....D..','............'],
  ['....DD....','...DSSD...','..DSSSSD..','.DSSSSSSD.','.DSSSSSSD.','..DDDDDD..','...D..D...','...D..DD..','..DD...D..','............'],
  ['....DD....','...DSSD...','..DSSSSD..','.DSSSSSSD.','.DSSSSSSD.','..DDDDDD..','...D..D...','..DD..D...','..D....DD.','............'],
  ['....DD....','...DSSD...','..DSSSSD..','.DSSSSSSD.','.DSSSSSSD.','..DDDDDD..','...D..D...','...D..DD..','..DD...D..','............'],
] as const;

export function createPixelArt(scene: Phaser.Scene): void {
  drawPixelArt(scene, ASSET_KEYS.tileGrass, ['GGGGGGGG','GGG.GGGG','GGGGGGGG','GGGGG.GG','GGGGGGGG','G.GGGGGG','GGGGGGGG','GGGGGGGG'], { G: C.grass, '.': C.grass2 }, 4);
  drawPixelArt(scene, ASSET_KEYS.tileRoad, ['RRRRRRRR','RLRLRLRR','RRRRRRRR','LRRRRLRR','RRRRRRRR','RRLRRRRR','RRRRRRRR','RLRLRLRR'], { R: C.road, L: C.roadLight }, 4);
  drawPixelArt(scene, ASSET_KEYS.tilePath, ['RRRRRRRR','RLRLRLRR','RRRRRRRR','LRRRRLRR','RRRRRRRR','RRLRRRRR','RRRRRRRR','RLRLRLRR'], { R: '#a98f75', L: '#c1a68a' }, 4);
  drawPixelArt(scene, ASSET_KEYS.school, ['....BBBBBBBB....','...BWWWWWWWWB...','..BWWWWWWWWWWB..','.BWWWWWWWWWWWWB.','.BWWWWWWWWWWWWB.','.BWWWWWWWWWWWWB.','.BWWWWWWWWWWWWB.','.BWWWWWWWWWWWWB.','.BWWWWWWWWWWWWB.','.BBBBBBBBBBBBBB.'], { B: C.outline, W: C.cream }, 5);
  drawPixelArt(scene, ASSET_KEYS.tower, ['....OO....','...OYYO...','..OYYYYO..','..OYYYYO..','...ODDO...','...ODDO...','..ODDDDO..','..ODDDDO..','...DDDD...','............'], { O: C.outline, Y: C.yellow, D: C.dark }, 3);
  drawPixelArt(scene, ASSET_KEYS.projectile, ['..YY..','YYYYYY','YYYYYY','..YY..'], { Y: C.yellow }, 3);
  const attackFrames = [
    ['....DD....','...DSSD...','..DSSSSD..','.DSSSSSSD.','.DSSSSSSD.','..DDDDDD..','...D..D...','..DDDDD...','..D....D..','............'],
    ['....DD....','...DSSD...','..DSSSSD..','.DSSSSSSD.','.DSSSSSSD.','..DDDDDD..','...D..D...','..DDDD....','.DD....DD.','............'],
    ['....DD....','...DSSD...','..DSSSSD..','.DSSSSSSD.','.DSSSSSSD.','..DDDDDD..','...D..D...','...DDDDD..','..D....D..','............'],
    ['....DD....','...DSSD...','..DSSSSD..','.DSSSSSSD.','.DSSSSSSD.','..DDDDDD..','...D..D...','..DDDD....','.DD....DD.','............'],
  ];
  const deathFrames = [
    ['............','....DD......','...DSSD.....','..DSSSSD....','...DDDD.....','..D..D......','............','............'],
    ['............','............','..DDDD......','.DSSSSD.....','..DDDD......','............','............','............'],
    ['............','............','............','..DDDD......','............','............','............','............'],
    ['............','............','............','............','............','............','............','............'],
  ];
  const variants = [
    { key: ASSET_KEYS.zombieWalk, color: C.skin },
    { key: ASSET_KEYS.zombieRunner, color: C.lime },
    { key: ASSET_KEYS.zombieTank, color: '#91a6ad' },
    { key: 'zombie-jumper', color: C.orange },
    { key: ASSET_KEYS.zombieHealer, color: '#b3e6d3' },
    { key: 'zombie-splitter', color: '#d5a3e8' },
    { key: ASSET_KEYS.zombieBoss, color: '#83d18b' },
  ];
  variants.forEach(({ key, color }) => {
    zombieFrames.forEach((frame, index) => drawPixelArt(scene, `${key}-walk-${index}`, [...frame], { D: C.outline, S: color }, 3));
    attackFrames.forEach((frame, index) => drawPixelArt(scene, `${key}-attack-${index}`, frame, { D: C.outline, S: color }, 3));
    deathFrames.forEach((frame, index) => drawPixelArt(scene, `${key}-death-${index}`, frame, { D: C.outline, S: color }, 3));
  });
  drawPixelArt(scene, ASSET_KEYS.coin, ['..YY..','.YYYY.','YYOOYY','YYOOYY','.YYYY.','..YY..'], { Y: C.yellow, O: C.orange }, 3);
  drawPixelArt(scene, ASSET_KEYS.heart, ['.RR..RR.','RRRRRRRR','RRRRRRRR','.RRRRRR.','..RRRR..','...RR...'], { R: '#f17b89' }, 3);
}

export function createPixelAnimations(scene: Phaser.Scene): void {
  const variants = [
    ['normal', ASSET_KEYS.zombieWalk],
    ['runner', ASSET_KEYS.zombieRunner],
    ['tank', ASSET_KEYS.zombieTank],
    ['jumper', 'zombie-jumper'],
    ['healer', ASSET_KEYS.zombieHealer],
    ['splitter', 'zombie-splitter'],
    ['boss', ASSET_KEYS.zombieBoss],
  ] as const;
  variants.forEach(([type, key]) => {
    const sequences = [
      { action: 'walk', frames: zombieFrames, frameRate: 7, repeat: -1 },
      { action: 'attack', frames: zombieFrames, frameRate: 9, repeat: -1 },
      { action: 'death', frames: zombieFrames, frameRate: 8, repeat: 0 },
    ];
    sequences.forEach(({ action, frames, frameRate, repeat }) => {
      const animationKey = `zombie-${type}-${action}`;
      if (scene.anims.exists(animationKey)) return;
      scene.anims.create({
        key: animationKey,
        frames: frames.map((_, index) => ({ key: `${key}-${action}-${index}` })),
        frameRate,
        repeat,
      });
    });
  });
}
