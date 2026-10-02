import * as migration_20260930_031410_initial from './20260930_031410_initial';

export const migrations = [
  {
    up: migration_20260930_031410_initial.up,
    down: migration_20260930_031410_initial.down,
    name: '20260930_031410_initial'
  },
];
