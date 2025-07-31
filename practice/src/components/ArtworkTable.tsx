import { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

type CustomPageEvent = {
  page?: number;
  first?: number;
  rows?: number;
};

export default function ArtworkTable() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(0);
  const rows = 10;

  const [selectedArtworksMap, setSelectedArtworksMap] = useState<Map<number, Artwork>>(new Map());

  const [overlayVisible, setOverlayVisible] = useState(false);
  const [bulkSelectCount, setBulkSelectCount] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPage(page);
  }, [page]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        setOverlayVisible(false);
      }
    };

    if (overlayVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [overlayVisible]);

  const fetchPage = async (pageIndex: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.artic.edu/api/v1/artworks?page=${pageIndex + 1}&limit=${rows}`);
      const data = await res.json();

      const pageData: Artwork[] = data.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        place_of_origin: item.place_of_origin,
        artist_display: item.artist_display,
        inscriptions: item.inscriptions,
        date_start: item.date_start,
        date_end: item.date_end,
      }));

      setArtworks(pageData);
      setTotalRecords(data.pagination.total);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: CustomPageEvent) => {
    if (typeof event.page === "number") {
      setPage(event.page);
    }
  };

  const onSelectionChange = (e: { value: Artwork[] }) => {
    const updatedMap = new Map(selectedArtworksMap);
    const currentPageIds = new Set(artworks.map((art) => art.id));

    for (let id of currentPageIds) {
      updatedMap.delete(id);
    }

    for (let art of e.value) {
      updatedMap.set(art.id, art);
    }

    setSelectedArtworksMap(updatedMap);
  };

  const currentPageSelection = artworks.filter((art) => selectedArtworksMap.has(art.id));

  const handleBulkSelectSubmit = async () => {
    if (!bulkSelectCount || bulkSelectCount < 1) {
      setOverlayVisible(false);
      return;
    }

    const totalToSelect = bulkSelectCount;
    const pagesNeeded = Math.ceil(totalToSelect / rows);
    const fetchedArtworks: Artwork[] = [];

    setLoading(true);

    try {
      for (let i = 0; i < pagesNeeded; i++) {
        const res = await fetch(`https://api.artic.edu/api/v1/artworks?page=${i + 1}&limit=${rows}`);
        const data = await res.json();

        const pageData: Artwork[] = data.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          place_of_origin: item.place_of_origin,
          artist_display: item.artist_display,
          inscriptions: item.inscriptions,
          date_start: item.date_start,
          date_end: item.date_end,
        }));

        fetchedArtworks.push(...pageData);
        if (fetchedArtworks.length >= totalToSelect) break;
      }

      const toSelect = fetchedArtworks.slice(0, totalToSelect);
      const updatedMap = new Map(selectedArtworksMap);
      for (const art of toSelect) {
        updatedMap.set(art.id, art);
      }

      setSelectedArtworksMap(updatedMap);
    } catch (err) {
      console.error("Bulk select fetch error:", err);
    } finally {
      setOverlayVisible(false);
      setBulkSelectCount(null);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 relative">
      <div className="mb-4 flex items-center gap-3">
        {/* Overlay Button on Left */}
        <div className="relative">
          <Button
            label=""
            icon="pi pi-angle-down"
            className="p-button-sm bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            onClick={() => setOverlayVisible((prev) => !prev)}
          />
          {overlayVisible && (
            <div
              ref={overlayRef}
              className="absolute top-full left-0 mt-2 bg-white border border-gray-400 shadow-lg p-3 rounded-md w-44 z-20"
            >
              <input
                type="number"
                min={1}
                max={totalRecords}
                value={bulkSelectCount ?? ""}
                onChange={(e) => setBulkSelectCount(parseInt(e.target.value))}
                placeholder="Select rows..."
                className="border px-2 py-1 text-sm rounded w-full mb-2"
              />
              <button
                onClick={handleBulkSelectSubmit}
                className="bg-gray-100 border text-sm px-3 py-1 rounded hover:bg-gray-200 w-full"
              >
                submit
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold">Artworks</h2>
      </div>

      <DataTable
        value={artworks}
        lazy
        paginator
        rows={rows}
        totalRecords={totalRecords}
        first={page * rows}
        onPage={onPageChange}
        loading={loading}
        dataKey="id"
        selection={currentPageSelection}
        onSelectionChange={onSelectionChange}
        selectionMode="multiple"
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Year" />
        <Column field="date_end" header="End Year" />
      </DataTable>
    </div>
  );
}
