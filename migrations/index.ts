import * as migration_20260626_170609_initial from './20260626_170609_initial';

export const migrations = [
  {
    up: migration_20260626_170609_initial.up,
    down: migration_20260626_170609_initial.down,
    name: '20260626_170609_initial'
  },
];
