import { usePlanogramLegend } from '../../hooks/split/usePlanogramLegend'

export function PlanogramLegend() {
  const { legendItems } = usePlanogramLegend()

  return (
    <div className="mini-map-legend">
      {legendItems.map((item) => (
        <span key={item.id} className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: item.miniMapColor }} />
          {item.label}
        </span>
      ))}
      <span className="legend-item">
        <span className="legend-dot avatar-dot" />
        Avatar
      </span>
    </div>
  )
}
