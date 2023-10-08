import { useExecuteQuery } from '@sisense/sdk-ui';
import * as DM from '../data-models/sample-ecommerce';
import { measures as measureFactory, QueryResultData } from '@sisense/sdk-data';
import { useLayoutEffect } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5hierarchy from '@amcharts/amcharts5/hierarchy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

type VoronoiItem = {
  id: string;
  name: string;
  value: number;
};

type VoronoiGroup = {
  name: string;
  children: VoronoiItem[];
};

export type VoronoiData = {
  children: VoronoiGroup[];
};

type ValueField = 'population' | 'totalRevenue';

export type AmVoronoiTreemapProps = {
  valueField: ValueField;
};

const AmVoronoiTreemap = (props: AmVoronoiTreemapProps) => {
  const { valueField } = props;

  // useExecuteQuery hook to load data from the Sample ECommerce data model
  const dimensions = [
    DM.CountryPopulation.Continent,
    DM.CountryPopulation.CountryCode,
    DM.CountryPopulation.CountryName,
  ];
  if (valueField === 'population') {
    dimensions.push(DM.CountryPopulation.Population);
  }

  const measures = [];
  if (valueField === 'totalRevenue') {
    measures.push(measureFactory.sum(DM.Commerce.Revenue, 'Total Revenue'));
  }

  const { data, isLoading, isError } = useExecuteQuery({
    dataSource: DM.DataSource,
    dimensions: dimensions,
    measures: measures,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error</div>;
  }
  function flatToNestedData(flatData: QueryResultData): VoronoiData {
    const nestedData: VoronoiData = {
      children: [],
    };

    flatData.rows.forEach((row) => {
      let group = nestedData.children.find((child) => child.name === row[0].data);
      if (!group) {
        group = {
          name: row[0].data,
          children: [],
        };
        nestedData.children.push(group);
      }

      group.children.push({
        id: row[1].data,
        name: row[2].data,
        value: row[3].data,
      });
    });

    return nestedData;
  }

  // Transform the data into a format that the amCharts Voronoi component can understand
  const dataSet = flatToNestedData(data);
  const valueThreshold = valueField === 'population' ? 2000000 : 6000;
  const title =
    valueField === 'population'
      ? 'Voronoi Treemap - World Population'
      : 'Voronoi Treemap - Total Revenue By Countries';

  return (
    <div>
      <h1>{title}</h1>
      <InternalReactWrapper data={dataSet} valueThreshold={valueThreshold} />
    </div>
  );
};

export default AmVoronoiTreemap;

type Props = {
  data: VoronoiData;
  /** The threshold for items to be grouped in "Others" */
  valueThreshold: number;
};

const InternalReactWrapper = (props: Props) => {
  const { data, valueThreshold } = props;

  // This code will only run one time
  useLayoutEffect(() => {
    /* Chart code */
    // Create root element
    // https://www.amcharts.com/docs/v5/getting-started/#Root_element
    const root = am5.Root.new('chartdiv');

    // Create custom theme...
    const myTheme = am5.Theme.new(root);

    // ... no stroke and fill on zero level
    myTheme.rule('Polygon', ['hierarchy', 'node', 'shape', 'depth0']).setAll({
      strokeOpacity: 0,
      fillOpacity: 0,
    });

    // ... thick stroke and full opacity on first level
    myTheme.rule('Polygon', ['hierarchy', 'node', 'shape', 'depth1']).setAll({
      strokeWidth: 5,
      fillOpacity: 1,
      stroke: am5.color(0x000000),
    });

    // ... no fill and thin stroke on second level
    myTheme.rule('Polygon', ['hierarchy', 'node', 'shape', 'depth2']).setAll({
      fillOpacity: 0,
      strokeWidth: 1,
      stroke: am5.color(0x000000),
    });

    //  ... by default last lever is not clickable, but we change it here, so, add pointer on the last level
    myTheme.rule('HierarchyNode', ['last']).setAll({
      cursorOverStyle: 'pointer',
    });

    // ... set global settings for all labels
    myTheme.rule('Label', ['node']).setAll({
      fontSize: 11,
      minScale: 0.7,
    });

    // ... hide label of zero level
    myTheme.rule('Label', ['node', 'depth0']).setAll({
      forceHidden: true,
    });

    // ... hide label of first level
    myTheme.rule('Label', ['node', 'depth1']).setAll({
      forceHidden: true,
    });

    // Set themes
    // https://www.amcharts.com/docs/v5/concepts/themes/
    root.setThemes([am5themes_Animated.new(root), myTheme]);

    // Group small countries into Others
    am5.array.each(data.children, function (group) {
      const others: VoronoiItem = {
        name: 'Others',
        id: 'Others',
        value: 0,
      };

      for (let i = group.children.length - 1; i >= 0; i--) {
        const item = group.children[i];
        if (item.value < valueThreshold) {
          others.value += item.value;
          am5.array.remove(group.children, item);
        }
      }

      if (others.value > 0) group.children.push(others);
    });

    // Create series
    // https://www.amcharts.com/docs/v5/charts/hierarchy/#Adding
    const series = root.container.children.push(
      am5hierarchy.VoronoiTreemap.new(root, {
        paddingLeft: 5,
        paddingRight: 5,
        paddingTop: 5,
        paddingBottom: 5,
        singleBranchOnly: true,
        downDepth: 2,
        upDepth: 0,
        initialDepth: 2,
        valueField: 'value',
        categoryField: 'name',
        childDataField: 'children',
        idField: 'name',
        type: 'polygon',
        cornerCount: 120,
      }),
    );

    // Show full name if polygon is big and only the id if it is small
    series.labels.template.adapters.add('x', function (x, target) {
      const dataItem = target.dataItem;
      if (dataItem) {
        const polygon = dataItem.get('polygon');
        if (polygon) {
          const minX = polygon.getPrivate('minX', 0);
          const maxX = polygon.getPrivate('maxX', 0);
          const dataContext = dataItem.dataContext as VoronoiItem;

          if (dataContext) {
            if (maxX - minX < 50) {
              target.set('text', dataContext.id);
            } else {
              target.set('text', dataContext.name);
            }
          }
        }
      }
      return x;
    });

    // When last level node is clicked, zoom to parent
    series.nodes.template.events.on('click', function (e) {
      const dataItem = e.target.dataItem;
      if (dataItem) {
        if (!dataItem.get('children')) {
          series.selectDataItem(dataItem.get('parent'));
        }
      }
    });

    // Set data
    // https://www.amcharts.com/docs/v5/charts/hierarchy/#Setting_data
    series.data.setAll([data]);

    // Select root node
    // https://www.amcharts.com/docs/v5/charts/hierarchy/#Pre_selected_branch
    series.set('selectedDataItem', series.dataItems[0]);

    // Make stuff animate on load
    series.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [data, valueThreshold]);

  return <div id="chartdiv" style={{ width: '970px', height: '950px' }}></div>;
};
