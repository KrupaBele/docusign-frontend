import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';

interface PDFField {
  id: string;
  type: 'signature' | 'date' | 'text' | 'checkbox';
  x: number; // Relative to page (0-1)
  y: number; // Relative to page (0-1)
  width: number;
  height: number;
  pageNumber: number;
  value?: string;
}

interface PDFViewerProps {
  file: string | File | Uint8Array;
  fields?: PDFField[];
  onFieldAdd?: (field: Omit<PDFField, 'id'>) => void;
  onFieldClick?: (field: PDFField) => void;
  scale?: number;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  fields = [],
  onFieldAdd,
  onFieldClick,
  scale = 1.5
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentScale, setCurrentScale] = useState(scale);
  const [pageRects, setPageRects] = useState<DOMRect[]>([]);

  // Initialize PDF.js
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const loadPdf = async () => {
      let pdfSource;
      if (typeof file === 'string') {
        pdfSource = file;
      } else if (file instanceof File) {
        pdfSource = URL.createObjectURL(file);
      } else {
        pdfSource = { data: file };
      }

      try {
        const loadingTask = pdfjsLib.getDocument(pdfSource);
        const loadedPdf = await loadingTask.promise;
        setPdf(loadedPdf);
      } catch (error) {
        console.error('PDF loading error:', error);
      }
    };

    loadPdf();

    return () => {
      if (pdf) {
        pdf.destroy();
      }
    };
  }, [file]);

  // Render PDF pages
  useEffect(() => {
    if (!pdf || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = ''; // Clear previous content

    const renderPages = async () => {
      const newPageRects: DOMRect[] = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: currentScale });

        const pageDiv = document.createElement('div');
        pageDiv.className = 'pdf-page';
        pageDiv.dataset.pageNumber = i.toString();
        pageDiv.style.width = `${viewport.width}px`;
        pageDiv.style.height = `${viewport.height}px`;
        pageDiv.style.margin = '0 auto 20px';
        pageDiv.style.position = 'relative';
        pageDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        pageDiv.appendChild(canvas);
        container.appendChild(pageDiv);

        await page.render({
          canvasContext: context,
          viewport
        }).promise;

        // Store page dimensions
        newPageRects.push(pageDiv.getBoundingClientRect());
      }

      setPageRects(newPageRects);
    };

    renderPages();
  }, [pdf, currentScale]);

  // Handle clicks to add fields
  const handlePageClick = (e: React.MouseEvent) => {
    if (!onFieldAdd) return;

    const pageElement = (e.target as HTMLElement).closest('.pdf-page');
    if (!pageElement) return;

    const pageNumber = parseInt(pageElement.getAttribute('data-page-number') || 1;
    const pageRect = pageElement.getBoundingClientRect();
    
    // Calculate click position relative to page (0-1)
    const x = (e.clientX - pageRect.left) / pageRect.width;
    const y = (e.clientY - pageRect.top) / pageRect.height;

    onFieldAdd({
      type: 'signature', // Default type, can be made configurable
      x,
      y,
      width: 0.2, // 20% of page width
      height: 0.1, // 10% of page height
      pageNumber
    });
  };

  return (
    <div 
      ref={containerRef}
      className="pdf-viewer-container"
      onClick={handlePageClick}
      style={{
        position: 'relative',
        overflow: 'auto',
        height: '100%',
        padding: '20px'
      }}
    >
      {/* Render fields */}
      {fields.map((field) => {
        const pageRect = pageRects[field.pageNumber - 1];
        if (!pageRect) return null;

        return (
          <div
            key={field.id}
            className="pdf-field"
            style={{
              position: 'absolute',
              left: `${field.x * pageRect.width}px`,
              top: `${field.y * pageRect.height}px`,
              width: `${field.width * pageRect.width}px`,
              height: `${field.height * pageRect.height}px`,
              border: '2px dashed blue',
              backgroundColor: 'rgba(0,0,255,0.1)',
              zIndex: 10,
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onFieldClick?.(field);
            }}
          >
            {field.type === 'signature' && field.value && (
              <img 
                src={field.value} 
                alt="Signature" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            )}
            {field.type === 'text' && field.value && (
              <div className="p-1">{field.value}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PDFViewer;