/**
 * React component rendering a bar chart from MUI library using data
 * loaded by Compose SDK useExecuteQuery hook
 * from the Sample ECommerce data model in a Sisense instance.
 */
import { useExecuteQuery } from '@sisense/sdk-ui';
import * as DM from '../data-models/sample-ecommerce';
import { measures } from '@sisense/sdk-data';
import { BarChart } from '@mui/x-charts/BarChart';
import { axisClasses } from '@mui/x-charts';

const valueFormatter = (value: number) => `$${value}`;

const MuiBarChart = () => {
  // useExecuteQuery hook to load data from the Sample ECommerce data model
  const { data, isLoading, isError } = useExecuteQuery({
    dataSource: DM.DataSource,
    dimensions: [DM.Commerce.AgeRange],
    measures: [
      measures.sum(DM.Commerce.Cost, 'Total Cost'),
      measures.sum(DM.Commerce.Revenue, 'Total Revenue'),
    ],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error</div>;
  }

  // Transform the data into a format that the MUI BarChart component can understand
  const dataset =
    data?.rows.map((row) => ({
      ageRange: row[0].data,
      totalCost: row[1].data,
      totalRevenue: row[2].data,
    })) || [];

  // Render the MUI BarChart component
  return (
    <BarChart
      dataset={dataset}
      xAxis={[{ scaleType: 'band', dataKey: 'ageRange', label: 'Age Range' }]}
      series={[
        { dataKey: 'totalCost', label: 'Total Cost', valueFormatter },
        { dataKey: 'totalRevenue', label: 'Total Revenue', valueFormatter },
      ]}
      yAxis={[
        {
          label: 'Cost and Revenue ($)',
        },
      ]}
      width={800}
      height={500}
      margin={{ left: 100 }}
      sx={{
        [`.${axisClasses.left} .${axisClasses.label}`]: {
          transform: 'rotate(-90deg) translate(0px, -50px)',
        },
      }}
    />
  );
};

export default MuiBarChart;
