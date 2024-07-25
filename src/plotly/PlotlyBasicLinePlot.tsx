/**
 * React component rendering a line plot from Plotly library using data
 * loaded by Compose SDK useExecuteQuery hook with specific dimensions and measures
 * from the Sample ECommerce data model in a Sisense instance.
 * The resulting graph offers insights into the ecommerce trends across different age ranges.
 */
import Plot from 'react-plotly.js';
import { measureFactory } from '@sisense/sdk-data';
import { useExecuteQuery } from '@sisense/sdk-ui';
import * as DM from '../data-models/sample-ecommerce';

const PlotlyBasicLinePlot = () => {
  // useExecuteQuery hook to load data from the Sample ECommerce data model
  const { data, isLoading, isError } = useExecuteQuery({
    dataSource: DM.DataSource,
    dimensions: [DM.Commerce.AgeRange],
    measures: [
      measureFactory.sum(DM.Commerce.Cost, 'Total Cost'),
      measureFactory.sum(DM.Commerce.Revenue, 'Total Revenue'),
    ],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error</div>;
  }

  // Transform the data into a format that the Plotly Line Chart component can understand
  const x1: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];
  data?.rows.forEach((row) => {
    x1.push(row[0].data);
    y1.push(row[1].data);
    y2.push(row[2].data);
  });

  const trace1: Plotly.Data = {
    x: x1,
    y: y1,
    type: 'bar',
    name: 'Total Cost',
  };

  const trace2: Plotly.Data = {
    x: x1,
    y: y2,
    type: 'bar',
    name: 'Total Revenue',
  };
  const plotData = [trace1, trace2];

  // Render the Plotly bar chart component
  const layout = {
    title: 'Total Cost and Revenue by Age Ranges',
    xaxis: { title: 'Age Range' },
    yaxis: { title: 'Cost and Revenue ($)' },
    width: 900,
    height: 500,
  };

  return <Plot data={plotData} layout={layout} />;
};

export default PlotlyBasicLinePlot;
