// Display helpers for the editorial numbering: order 0 → "01", and the area-page
// meta line "( 01 / 04 )".
export const disciplineNumber = (order: number): string => String(order + 1).padStart(2, '0')

export const disciplineMeta = (order: number, total: number): string =>
  `( ${disciplineNumber(order)} / ${String(total).padStart(2, '0')} )`
