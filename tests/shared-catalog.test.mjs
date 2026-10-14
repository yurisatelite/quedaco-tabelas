import test from 'node:test';
import assert from 'node:assert/strict';
import {quedacoIntegration} from '../src/quedaco-integration.mjs';

test('Tabelas consulta localidades, tags e climas pela API ativa',()=>{
  const provider={family:'quedaco',capabilities:{npcDatabase:true},listNpcs:()=>[],listRegions:()=>[],getWorldCatalog:()=>({places:[{id:'vila'}],tags:[{id:'tag:x'}],climates:[{id:'frio'}]})};
  const module={active:true,api:provider},game={modules:new Map([['quedaco',module]])};
  assert.equal(quedacoIntegration(game).places[0].id,'vila');assert.equal(quedacoIntegration(game).climates[0].id,'frio');
  module.active=false;assert.equal(quedacoIntegration(game),null);
});
