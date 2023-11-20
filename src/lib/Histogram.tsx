/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useMemo } from 'react';
import type { Attribute, DataSource, Filter, Data } from '@sisense/sdk-data';
import type { BaseAxisStyleOptions, BaseStyleOptions, ValueToColorMap } from '@sisense/sdk-ui';
import { useExecuteQuery, Table } from '@sisense/sdk-ui';
import { useBuildQuery } from './histogram/useBuildQuery';
import { FREQUENCY, useProcessResults } from './histogram/useProcessResults';
import { HistogramChart } from './HistogramChart';
import { useBuildMinMaxQuery } from './histogram/useBuildMinMaxQuery';

const IntermediateTable = ({ title, dataSet }: { title: string; dataSet: Data }) => {
  const tableStyleOptions = (rowsCnt: number, columnCnt: number) => ({
    height: (columnCnt > 10 ? 20 : 0) + 30 + Math.min(rowsCnt, 25) * 25,
    headersColor: true,
    alternatingColumnsColor: false,
    alternatingRowsColor: true,
  });

  return (
    <div style={{ backgroundColor: 'aliceblue', border: '1px solid lightgray', margin: '20px' }}>
      <span style={{ paddingLeft: '10px' }}>{title}</span>
      <Table
        dataSet={dataSet}
        dataOptions={{ columns: dataSet.columns }}
        styleOptions={tableStyleOptions(dataSet.rows.length, dataSet.columns.length)}
      />
    </div>
  );
};

export interface HistogramStyleOptions extends BaseStyleOptions, BaseAxisStyleOptions {
  binCount?: number | 'auto';
  barBorder?: boolean;
  binSizePrecision?: number;
  subtype?: 'stacked' | 'overlay';
}

export interface HistogramDataOptions {
  value: Attribute;
  category: Attribute[];
  seriesToColorMap?: ValueToColorMap;
}

export type HistogramProps = {
  dataSource?: DataSource;
  dataOptions: HistogramDataOptions;
  filters?: Filter[];
  styleOptions?: HistogramStyleOptions;
};

export const Histogram = ({ dataSource, dataOptions, filters, styleOptions }: HistogramProps) => {
  // Widget plug-in buildQuery: get min max count per category
  const minMaxQueryProps = useBuildMinMaxQuery({ dataSource, dataOptions, filters });

  const {
    data: minMaxData,
    isLoading: isMinMaxLoading,
    error: isMinMaxError,
  } = useExecuteQuery(minMaxQueryProps);

  // Widget plug-in buildQuery: get bin frequrency data per bin and cateogry
  const frequencyDataQueryProps = useBuildQuery({
    dataSource,
    minMaxData,
    dataOptions,
    filters,
    styleOptions,
  });

  const { data: binData, isLoading, error } = useExecuteQuery(frequencyDataQueryProps);

  // Widget plug-in processResults: create histogram frequency data
  const histogramData = useProcessResults({ binData, dataOptions });

  // Widget plug-in render: render chart with histogram data
  const histogramChartDataOptions = useMemo(
    () => ({
      bins: dataOptions.value,
      fequency: { name: FREQUENCY },
      breakBy: dataOptions.category,
      seriesToColorMap: dataOptions.seriesToColorMap,
    }),
    [dataOptions.value, dataOptions.seriesToColorMap, dataOptions.category],
  );

  if (!minMaxData || isMinMaxLoading) return <div>{'loading'}</div>;
  if (isMinMaxError) return <div>{isMinMaxError}</div>;
  if (!binData || isLoading || !histogramData) return <div>{'loading'}</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <IntermediateTable title={'Min Max Data'} dataSet={minMaxData} />
      <IntermediateTable title={'Bin Data'} dataSet={binData} />
      <IntermediateTable title={'Histogram Data'} dataSet={histogramData} />
      <HistogramChart
        dataSet={histogramData}
        dataOptions={histogramChartDataOptions}
        styleOptions={styleOptions}
      />
    </>
  );
};
