import {
  BarElement,
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
import ChartDataLabels from 'chartjs-plugin-datalabels'

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
      Title,
      BarElement,
      ChartDataLabels
    )

    registered = true
  }
}
