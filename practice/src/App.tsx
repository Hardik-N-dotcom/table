import React from 'react';
import ArtworkTable from './components/ArtworkTable';

const App: React.FC = () => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Artworks - PrimeReact DataTable</h2>
      <ArtworkTable />
    </div>
  );
};

export default App;
