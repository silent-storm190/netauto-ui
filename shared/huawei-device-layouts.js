(() => {
  'use strict';

  const CATALOG = [
    ['HW28', 'HUAWEI', ['Huawei S5328', 'INF Huawei S5328'], 'S5328'],
    ['HS12', 'HUAWEI12', ['INF Huawei CE12804S Stack', 'Huawei_Stack_CE12804S'], 'CE12804S Stack'],
    ['HS67', 'HUAWEI', ['INF Huawei S6720-24 Stack', 'INF Huawei S6720 Stack', 'Huawei_Stack_S6720_24Port'], 'S6720-24 Stack'],
    ['HS57', 'HUAWEI', ['INF Huawei S5721 Stack', 'Huawei_Stack_S5721'], 'S5721 Stack'],
    ['HW93', 'HUAWEI', ['Huawei S9303'], 'S9303'],
    ['HW67', 'HUAWEI', ['Huawei S6720 24 port', 'INF Huawei S6720-24', 'INF Huawei S6720', 'INF MPLS HW S6720'], 'S6720-24'],
    ['HW58', 'HUAWEI', ['INF Huawei S5720-EI', 'Huawei S5720-EI'], 'S5720-EI'],
    ['HS48', 'HUAWEI', ['INF Huawei S6348 Stack', 'Huawei_Stack_S6348'], 'S6348 Stack'],
    ['HW12', 'HUAWEI12', ['INF Huawei CE12804S', 'Huawei CE12804S'], 'CE12804S'],
    ['HW48', 'HUAWEI', ['Huawei S6348', 'INF Huawei S6348'], 'S6348'],
    ['HS50', 'HUAWEI', ['Huawei S5720-SI', 'Huawei_Stack_S5720_SI'], 'S5720-SI Stack'],
    ['HW68', 'HUAWEI', ['Huawei S6720 48 port', 'INF Huawei S6720 48port', 'INF Huawei S6720', 'INF Huawei S6720-48', 'INF MPLS HW S6720'], 'S6720-48'],
    ['HW24', 'HUAWEI', ['Huawei S6324', 'INF MPLS HW S6324', 'INF Huawei S6324'], 'S6324'],
    ['HW50', 'HUAWEI', ['Huawei S5720-SI', 'INF Huawei S5720-SI'], 'S5720-SI'],
    ['HW57', 'HUAWEI', ['INF Huawei S5720-EI', 'Huawei S5721', 'INF Huawei S5721'], 'S5721'],
    ['HS24', 'HUAWEI', ['Huawei_Stack_S6324', 'INF Huawei S6324 Stack'], 'S6324 Stack'],
    ['HS68', 'HUAWEI', ['INF Huawei S6720 Stack', 'INF Huawei S6720-48 Stack', 'Huawei_Stack_S6720_48Port', 'INF Huawei S6720 48port Stack'], 'S6720-48 Stack'],
    ['HW63', 'HUAWEI', ['INF Huawei S6730 H24', 'Huawei S6730_H24', 'INF MPLS HW S6730 HS24'], 'S6730-H24'],
    ['HS64', 'HUAWEI', ['Huawei_Stack_ S6730_H48', 'INF Huawei S6730 H48 Stack'], 'S6730-H48 Stack'],
    ['HW53', 'HUAWEI', ['Huawei S5735_S32', 'INF Huawei S5735 S32'], 'S5735-S32'],
    ['HW64', 'HUAWEI', ['INF Huawei S6730 H48', 'INF Huawei S6730-H48', 'Huawei S6730_H48'], 'S6730-H48'],
    ['HS63', 'HUAWEI', ['Huawei_Stack_ S6730_H24', 'INF Huawei S6730 H24 Stack'], 'S6730-H24 Stack'],
    ['HW51', 'HUAWEI', ['Huawei S5735_S32ST4X', 'Huawei S5731_S32', 'INF Huawei S5731 S32'], 'S5731-S32'],
    ['HW52', 'HUAWEI', ['Huawei S5731-S24T4X', 'Huawei S5731_S24'], 'S5731-S24'],
    ['HS52', 'HUAWEI', ['Huawei S5731-S24T4X', 'Huawei_Stack_ S5731_S24', 'Huawei S5731_S24'], 'S5731-S24 Stack'],
    ['HW54', 'HUAWEI', ['Huawei S5735_S24', 'Huawei S5735', 'INF Huawei S5735-S24T4X', 'INF Huawei S5735', 'INF Huawei S5735 S24'], 'S5735-S24'],
    ['HS54', 'HUAWEI', ['INF Huawei S5735', 'INF Huawei S5735-S24T4X', 'INF Huawei S5735 S24 Stack', 'Huawei_Stack_ S5735_S24', 'Huawei S5735'], 'S5735-S24 Stack'],
    ['HS53', 'HUAWEI', ['Huawei S5735_S32', 'INF Huawei S5735 S32', 'Huawei_Stack_ S5735_S32'], 'S5735-S32 Stack'],
    ['HS51', 'HUAWEI', ['Huawei_Stack_ S5731_S32'], 'S5731-S32 Stack'],
    ['HW61', 'HUAWEI', ['Huawei S6730-H24X6C-V2'], 'S6730-H24X6C-V2'],
    ['HS61', 'HUAWEI', ['Huawei_Stack_S6730-H24X6C-V2'], 'S6730-H24X6C-V2 Stack'],
    ['HS62', 'HUAWEI', ['Huawei_Stack_S6730-H48X6C-V2'], 'S6730-H48X6C-V2 Stack'],
    ['HW62', 'HUAWEI', ['Huawei S6730-H48X6C-V2'], 'S6730-H48X6C-V2']
  ].map(([modelDev, typeDev, typeDevEX, manufacturerModel]) => ({modelDev, typeDev, typeDevEX, manufacturerModel}));

  const PROFILE_BY_MODEL = {
    HW28: {members: 1, blocks: [{kind: 'GE', count: 24, prefix: 'GigabitEthernet', slot: 0, subslot: 0, media: 'SFP', speedGbps: 1, columns: 12}, {kind: '10GE', count: 4, prefix: 'XGigabitEthernet', slot: 0, subslot: 1, media: 'SFP+', speedGbps: 10, role: 'uplink', columns: 4}]},
    HW24: {members: 1, blocks: [{kind: '10GE', count: 24, prefix: 'XGigabitEthernet', media: 'SFP+', speedGbps: 10, columns: 12}]},
    HW48: {members: 1, blocks: [{kind: '10GE', count: 48, prefix: 'XGigabitEthernet', media: 'SFP+', speedGbps: 10, columns: 24}]},
    HW50: {members: 1, blocks: [{kind: 'GE', count: 24, prefix: 'GigabitEthernet', media: 'RJ45', speedGbps: 1, columns: 12}, {kind: '10GE', count: 4, prefix: 'XGigabitEthernet', media: 'SFP+', speedGbps: 10, role: 'uplink', columns: 4}]},
    HW51: {members: 1, blocks: [{kind: 'GE', count: 32, prefix: 'GigabitEthernet', media: 'SFP/RJ45', speedGbps: 1, columns: 16}, {kind: '10GE', count: 4, prefix: 'XGigabitEthernet', media: 'SFP+', speedGbps: 10, role: 'uplink', columns: 4}]},
    HW52: {members: 1, blocks: [{kind: 'GE', count: 24, prefix: 'GigabitEthernet', media: 'RJ45', speedGbps: 1, columns: 12}, {kind: '10GE', count: 4, prefix: 'XGigabitEthernet', media: 'SFP+', speedGbps: 10, role: 'uplink', columns: 4}]},
    HW53: {members: 1, blocks: [{kind: 'GE', count: 32, prefix: 'GigabitEthernet', media: 'SFP/RJ45', speedGbps: 1, columns: 16}, {kind: '10GE', count: 4, prefix: 'XGigabitEthernet', media: 'SFP+', speedGbps: 10, role: 'uplink', columns: 4}]},
    HW54: {members: 1, blocks: [{kind: 'GE', count: 24, prefix: 'GigabitEthernet', media: 'RJ45', speedGbps: 1, columns: 12}, {kind: '10GE', count: 4, prefix: 'XGigabitEthernet', media: 'SFP+', speedGbps: 10, role: 'uplink', columns: 4}]},
    HW57: {members: 1, blocks: [{kind: 'GE', count: 24, prefix: 'GigabitEthernet', media: 'RJ45', speedGbps: 1, columns: 12}, {kind: '10GE', count: 4, prefix: 'XGigabitEthernet', media: 'SFP+', speedGbps: 10, role: 'uplink', columns: 4}]},
    HW58: {members: 1, blocks: [{kind: 'GE', count: 28, prefix: 'GigabitEthernet', media: 'RJ45/SFP', speedGbps: 1, columns: 14}, {kind: '10GE', count: 4, prefix: 'XGigabitEthernet', media: 'SFP+', speedGbps: 10, role: 'uplink', columns: 4}]},
    HW67: {members: 1, blocks: [{kind: '10GE', count: 24, prefix: 'XGigabitEthernet', media: 'SFP+', speedGbps: 10, columns: 12}, {kind: '40GE', count: 2, prefix: '40GE', media: 'QSFP+', speedGbps: 40, role: 'uplink', columns: 2}]},
    HW68: {members: 1, blocks: [{kind: '10GE', count: 48, prefix: 'XGigabitEthernet', media: 'SFP+', speedGbps: 10, columns: 24}, {kind: '40GE', count: 2, prefix: '40GE', media: 'QSFP+', speedGbps: 40, role: 'uplink', columns: 2}]},
    HW63: {members: 1, blocks: [{kind: '10GE', count: 24, prefix: 'XGigabitEthernet', media: 'SFP+', speedGbps: 10, columns: 12}, {kind: '40GE', count: 6, prefix: '40GE', media: 'QSFP+', speedGbps: 40, role: 'uplink', columns: 6}]},
    HW64: {members: 1, blocks: [{kind: '10GE', count: 48, prefix: 'XGigabitEthernet', media: 'SFP+', speedGbps: 10, columns: 24}, {kind: '40/100GE', count: 6, prefix: '100GE', media: 'QSFP28', speedGbps: 100, role: 'uplink', columns: 6}]},
    HW61: {members: 1, modern: true, blocks: [{kind: '10GE', count: 24, prefix: '10GE', media: 'SFP+', speedGbps: 10, columns: 12}, {kind: '40/100GE', count: 6, prefix: '100GE', media: 'QSFP28', speedGbps: 100, role: 'uplink', columns: 6}]},
    HW62: {members: 1, modern: true, blocks: [{kind: '10GE', count: 48, prefix: '10GE', media: 'SFP+', speedGbps: 10, columns: 24}, {kind: '40/100GE', count: 6, prefix: '100GE', media: 'QSFP28', speedGbps: 100, role: 'uplink', columns: 6}]}
  };

  const STACK_BASE = {HS24: 'HW24', HS48: 'HW48', HS50: 'HW50', HS51: 'HW51', HS52: 'HW52', HS53: 'HW53', HS54: 'HW54', HS57: 'HW57', HS61: 'HW61', HS62: 'HW62', HS63: 'HW63', HS64: 'HW64', HS67: 'HW67', HS68: 'HW68'};

  const clone = value => JSON.parse(JSON.stringify(value));
  const compact = name => name
    .replace('XGigabitEthernet', 'XG')
    .replace('GigabitEthernet', 'GE')
    .replace(/^100GE/, '100G')
    .replace(/^40GE/, '40G')
    .replace(/^10GE/, '10G');

  function interfaceName(block, member, port, profile) {
    if (profile.modern) return `${block.prefix}${member}/0/${port}`;
    const slot = block.slot ?? member;
    const subslot = block.subslot ?? 0;
    return `${block.prefix}${slot}/${subslot}/${port}`;
  }

  function buildFixed(profile) {
    const interfaces = [];
    const layoutGroups = [];
    for (let member = 0; member < profile.members; member += 1) {
      profile.blocks.forEach((block, blockIndex) => {
        const groupId = `member-${member + 1}-${block.kind.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const group = {id: groupId, member: member + 1, label: `${block.kind} · ${block.media}`, kind: block.kind, media: block.media, role: block.role || 'service', columns: block.columns, interfaceIds: []};
        for (let port = 1; port <= block.count; port += 1) {
          const cliName = interfaceName(block, member, port, profile);
          group.interfaceIds.push(cliName);
          interfaces.push({id: cliName, cliName, label: compact(cliName), type: block.kind, speedGbps: block.speedGbps, media: block.media, role: block.role || 'service', member: member + 1, slot: block.slot ?? member, port, status: 'unknown', face: {groupId, row: Math.floor((port - 1) / block.columns) + 1, column: ((port - 1) % block.columns) + 1, order: port}});
        }
        layoutGroups.push(group);
      });
    }
    return {interfaces, layoutGroups, bays: []};
  }

  function buildCe12804s(stack) {
    const members = stack ? 2 : 1;
    const interfaces = [];
    const layoutGroups = [];
    const bays = [];
    for (let member = 1; member <= members; member += 1) {
      for (let slot = 1; slot <= 4; slot += 1) bays.push({id: `chassis-${member}-slot-${slot}`, member, slot, kind: 'LPU', installed: slot === 3 || slot === 4, cardProfile: slot >= 3 ? '48 × 10GE SFP+' : null});
      for (const slot of [3, 4]) {
        const groupId = `chassis-${member}-slot-${slot}`;
        const ids = [];
        for (let port = 0; port < 48; port += 1) {
          const cliName = stack ? `10GE${member}/${slot}/0/${port}` : `10GE${slot}/0/${port}`;
          ids.push(cliName);
          interfaces.push({id: cliName, cliName, label: compact(cliName), type: '10GE', speedGbps: 10, media: 'SFP+', role: 'service', member, slot, port, status: 'unknown', source: 'netauto-inventory-template', face: {groupId, row: Math.floor(port / 24) + 1, column: (port % 24) + 1, order: port + 1}});
        }
        layoutGroups.push({id: groupId, member, slot, label: `LPU ${slot} · 48 × 10GE`, kind: '10GE', media: 'SFP+', role: 'service', columns: 24, interfaceIds: ids});
      }
    }
    return {interfaces, layoutGroups, bays};
  }

  function buildS9303() {
    return {
      interfaces: [],
      layoutGroups: [],
      bays: Array.from({length: 3}, (_, index) => ({id: `slot-${index + 1}`, member: 1, slot: index + 1, kind: 'LPU', installed: false, cardProfile: null}))
    };
  }

  function build(modelDev) {
    const catalog = CATALOG.find(item => item.modelDev === modelDev);
    if (!catalog) return null;
    if (modelDev === 'HW12' || modelDev === 'HS12') return {...catalog, family: 'CloudEngine 12800', stack: modelDev === 'HS12', members: modelDev === 'HS12' ? 2 : 1, chassis: true, confidence: 'inventory-template', requiresInventory: true, notes: ['CE12804S có 4 khe LPU; số interface thật phụ thuộc card đang lắp.', 'Preview dùng mẫu NetAuto đã quan sát: LPU 3 và 4, mỗi card 48 × 10GE.'], ...buildCe12804s(modelDev === 'HS12')};
    if (modelDev === 'HW93') return {...catalog, family: 'S9300', stack: false, members: 1, chassis: true, confidence: 'chassis-only', requiresInventory: true, notes: ['S9303 có 3 khe LPU. modelDev không đủ để suy ra interface khi chưa có inventory card.'], ...buildS9303()};
    const baseModel = STACK_BASE[modelDev] || modelDev;
    const sourceProfile = PROFILE_BY_MODEL[baseModel];
    if (!sourceProfile) return {...catalog, family: catalog.manufacturerModel.split(/[- ]/)[0], stack: modelDev.startsWith('HS'), members: modelDev.startsWith('HS') ? 2 : 1, chassis: false, confidence: 'unknown', requiresInventory: true, notes: ['Chưa có profile mặt trước cho model này.'], interfaces: [], layoutGroups: [], bays: []};
    const profile = clone(sourceProfile);
    profile.members = modelDev.startsWith('HS') ? 2 : 1;
    return {...catalog, family: catalog.manufacturerModel.split(/[- ]/)[0], stack: profile.members > 1, members: profile.members, chassis: false, confidence: 'manufacturer-and-inventory', requiresInventory: false, notes: ['Tên interface và số lượng được đối chiếu với snapshot inventory NetAuto.', 'Vị trí là mô phỏng mặt trước theo nhóm cổng; trạng thái/module phải merge từ response thiết bị.'], ...buildFixed(profile)};
  }

  function withInventory(layout, inventory = []) {
    if (!layout || !Array.isArray(inventory) || !inventory.length) return layout;
    const byName = new Map(inventory.map(item => [String(item.cliName || item.id || item.name), item]));
    layout.interfaces = layout.interfaces.map(port => ({...port, ...(byName.get(port.cliName) || {})}));
    return layout;
  }

  function get(modelDev, options = {}) {
    const layout = build(String(modelDev || '').toUpperCase().trim());
    if (!layout) return null;
    withInventory(layout, options.inventory);
    layout.summary = layout.interfaces.reduce((summary, port) => {
      summary.total += 1;
      summary.byType[port.type] = (summary.byType[port.type] || 0) + 1;
      summary.byStatus[port.status || 'unknown'] = (summary.byStatus[port.status || 'unknown'] || 0) + 1;
      return summary;
    }, {total: 0, byType: {}, byStatus: {}});
    return layout;
  }

  function resolve(value) {
    const normalized = String(value || '').toLowerCase().replace(/[_\s-]+/g, ' ').trim();
    const exact = CATALOG.find(item => item.modelDev.toLowerCase() === normalized || item.typeDevEX.some(alias => alias.toLowerCase().replace(/[_\s-]+/g, ' ').trim() === normalized));
    return exact ? exact.modelDev : null;
  }

  window.HuaweiDeviceLayouts = Object.freeze({catalog: clone(CATALOG), get, resolve});
})();
