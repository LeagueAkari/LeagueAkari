import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip
} from 'chart.js'

let registered = false

export function registerChartJS() {
  if (!registered) {
    ChartJS.register(
      RadialLinearScale,
      PointElement,
      LineElement,
      Filler,
      Tooltip,
      Legend,
      CategoryScale,
      LinearScale,
      Title
    )

    registered = true
  }
}
