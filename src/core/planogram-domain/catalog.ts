import type { AssetDefinition, AssetId } from './types'

const BED_DOUBLE_URL = new URL('../../models/items/bedDouble.glb', import.meta.url).href
const BOOKCASE_OPEN_LOW_URL = new URL('../../models/items/bookcaseOpenLow.glb', import.meta.url).href
const CABINET_BED_DRAWER_TABLE_URL = new URL('../../models/items/cabinetBedDrawerTable.glb', import.meta.url).href
const LAMP_SQUARE_TABLE_URL = new URL('../../models/items/lampSquareTable.glb', import.meta.url).href
const PLANT_SMALL_URL = new URL('../../models/items/plantSmall.glb', import.meta.url).href
const RUG_RECTANGLE_URL = new URL('../../models/items/rugRectangle.glb', import.meta.url).href

export const ASSET_CATALOG: Record<AssetId, AssetDefinition> = {
  bedDouble: {
    fitAxis: 'footprint',
    id: 'bedDouble',
    label: 'Bed',
    miniMapColor: '#d57777',
    targetSizeM: { depth: 2.05, height: 0.62, width: 1.72 },
    url: BED_DOUBLE_URL,
  },
  bookcaseOpenLow: {
    fitAxis: 'height',
    id: 'bookcaseOpenLow',
    label: 'Bookcase',
    miniMapColor: '#77a3d5',
    targetSizeM: { depth: 0.35, height: 1.35, width: 1.1 },
    url: BOOKCASE_OPEN_LOW_URL,
  },
  cabinetBedDrawerTable: {
    fitAxis: 'height',
    id: 'cabinetBedDrawerTable',
    label: 'Nightstand',
    miniMapColor: '#d6a46c',
    targetSizeM: { depth: 0.42, height: 0.6, width: 0.5 },
    url: CABINET_BED_DRAWER_TABLE_URL,
  },
  lampSquareTable: {
    fitAxis: 'height',
    id: 'lampSquareTable',
    label: 'Table Lamp',
    miniMapColor: '#d9cf7a',
    targetSizeM: { depth: 0.24, height: 0.42, width: 0.24 },
    url: LAMP_SQUARE_TABLE_URL,
  },
  plantSmall: {
    fitAxis: 'height',
    id: 'plantSmall',
    label: 'Plant',
    miniMapColor: '#66b98e',
    targetSizeM: { depth: 0.45, height: 0.85, width: 0.45 },
    url: PLANT_SMALL_URL,
  },
  rugRectangle: {
    fitAxis: 'footprint',
    id: 'rugRectangle',
    label: 'Rug',
    miniMapColor: '#b88ecf',
    targetSizeM: { depth: 2.2, height: 0.02, width: 1.6 },
    url: RUG_RECTANGLE_URL,
  },
}
