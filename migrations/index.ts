import * as migration_20260930_031410_initial from './20260930_031410_initial';
import * as migration_20261002_225301_media_prefix from './20261002_225301_media_prefix';

export const migrations = [
  {
    up: migration_20260930_031410_initial.up,
    down: migration_20260930_031410_initial.down,
    name: '20260930_031410_initial',
  },
  {
    up: migration_20261002_225301_media_prefix.up,
    down: migration_20261002_225301_media_prefix.down,
    name: '20261002_225301_media_prefix'
  },
];
