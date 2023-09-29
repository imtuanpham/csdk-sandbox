/**
 * React component rendering a stacked bar chart and line chart combined from MUI library using data
 * loaded by Compose SDK useExecuteQuery hook
 * from the Sample ECommerce data model in a Sisense instance.
 */
import { useExecuteQuery } from '@sisense/sdk-ui';
import * as DM from '../data-models/sample-ecommerce';
import { measures } from '@sisense/sdk-data';
import { BarPlot } from '@mui/x-charts/BarChart';
import { LinePlot } from '@mui/x-charts/LineChart';
import { ChartContainer } from '@mui/x-charts/ChartContainer';
import { AllSeriesType } from '@mui/x-charts/models';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { axisClasses } from '@mui/x-charts';

const MuiHybridChart = () => {
  // useExecuteQuery hook to load data from the Sample ECommerce data model
  const { data, isLoading, isError } = useExecuteQuery({
    dataSource: DM.DataSource,
    dimensions: [DM.Commerce.AgeRange],
    measures: [
      measures.sum(DM.Commerce.Cost, 'Total Cost'),
      measures.sum(DM.Commerce.Revenue, 'Total Revenue'),
      measures.sum(DM.Commerce.Quantity, 'Total Quantity'),
    ],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error</div>;
  }

  // Transform the data into a format that the MUI ChartContainer component can understand
  const seriesAgeRange = data?.rows.map((row) => row[0].data) || [];
  const seriesTotalCost = data?.rows.map((row) => row[1].data) || [];
  const seriesTotalRevenue = data?.rows.map((row) => row[2].data) || [];
  const seriesTotalQuantity = data?.rows.map((row) => row[3].data) || [];

  const series = [
    {
      type: 'bar',
      yAxisKey: 'costAndRevenue',
      data: seriesTotalCost,
    },
    {
      type: 'bar',
      yAxisKey: 'costAndRevenue',
      data: seriesTotalRevenue,
    },
    {
      type: 'line',
      yAxisKey: 'quantity',
      color: 'red',
      data: seriesTotalQuantity,
    },
  ] as AllSeriesType[];

  return (
    <ChartContainer
      series={series}
      width={860}
      height={500}
      margin={{ left: 100, right: 100 }}
      xAxis={[
        {
          id: 'age',
          data: seriesAgeRange,
          scaleType: 'band',
          valueFormatter: (value) => value.toString(),
        },
      ]}
      sx={{
        [`.${axisClasses.left} .${axisClasses.label}`]: {
          transform: 'rotate(-90deg) translate(0px, -50px)',
        },
        [`.${axisClasses.right} .${axisClasses.label}`]: {
          transform: 'rotate(-90deg) translate(0px, 35px)',
        },
      }}
      yAxis={[
        {
          id: 'costAndRevenue',
          scaleType: 'linear',
          label: 'Cost and Revenue ($)',
        },
        {
          id: 'quantity',
          scaleType: 'linear',
          label: 'Total Quantity',
        },
      ]}
    >
      <BarPlot />
      <LinePlot />
      <ChartsXAxis label="Age Range" position="bottom" axisId="age" />
      <ChartsYAxis label="Cost and Revenue ($)" position="left" axisId="costAndRevenue" />
      <ChartsYAxis label="Total Quantity" position="right" axisId="quantity" />
    </ChartContainer>
  );
};

export default MuiHybridChart;
