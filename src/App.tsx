import { SisenseContextProvider } from '@sisense/sdk-ui';
import { HistogramPage } from './webinar2/histogram-page';

function App() {
  const { VITE_APP_SISENSE_URL, VITE_APP_SISENSE_TOKEN } = import.meta.env;
  return (
    <>
      <SisenseContextProvider url={VITE_APP_SISENSE_URL} token={VITE_APP_SISENSE_TOKEN}>
        <HistogramPage />
      </SisenseContextProvider>
    </>
  );
}

export default App;
