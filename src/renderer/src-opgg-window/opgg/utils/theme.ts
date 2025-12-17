export function getTierTextColorClass(tier: number | null | undefined) {
  switch (tier) {
    case 0:
      return 'text-[#ff7300]' // O ! P !
    case 1:
      return 'text-[#0093ff]'
    case 2:
      return 'text-[#00bba3]'
    case 3:
      return 'text-[#ffb900]'
    case 4:
      return 'text-[#9aa4af]'
    case 5:
      return 'text-[#a88a67]'
    case 6:
      return 'text-[#552253]'
    default:
      return 'text-[#c9c9c9]'
  }
}
