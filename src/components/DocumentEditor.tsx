import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Edit,
  Save,
  Send,
  PenTool,
  Calendar,
  Type,
  CheckSquare,
  Plus,
  User,
  Mail,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Copy,
  Menu,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { Template, Recipient, DocumentField } from "../types";
import SignatureModal, { SavedSignature } from "./SignatureModal";
import SendForSignatureModal, { SendData } from "./SendForSignatureModal";
import {
  sendSignatureRequest,
  requestNotificationPermission,
} from "../services/emailService";
import { PDFDocument, StandardFonts } from "pdf-lib";
const API_URL = import.meta.env.VITE_API_URL;

interface DocumentEditorProps {
  template: Template;
  onBack: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  template,
  onBack,
}) => {
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "1", name: "Full name", email: "email@example.com", role: "signer" },
  ]);
  const [selectedField, setSelectedField] = useState<
    "signature" | "date" | "text" | "checkbox" | null
  >(null);
  const [documentFields, setDocumentFields] = useState<DocumentField[]>([]);
  const [isEditingRecipient, setIsEditingRecipient] = useState<string | null>(
    null
  );
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [documentContent, setDocumentContent] = useState(template.content);
  const [documentTitle, setDocumentTitle] = useState(template.title);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [editingRecipientId, setEditingRecipientId] = useState<string | null>(
    null
  );
  const [signingFieldId, setSigningFieldId] = useState<string | null>(null);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [showSendModal, setShowSendModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [sendStatus, setSendStatus] = useState<{
    show: boolean;
    success: boolean;
    message: string;
    details?: string;
  }>({ show: false, success: false, message: "" });
  const [showSignatureInterface, setShowSignatureInterface] = useState(false);
  const [currentSigningField, setCurrentSigningField] = useState<string | null>(
    null
  );
  const [pdfDimensions, setPdfDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [viewerDimensions, setViewerDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [saveStatus, setSaveStatus] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  }>({ show: false, success: false, message: "" });

  // Add state for multi-page support
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageHeights, setPageHeights] = useState<{ [key: number]: number }>({});
  const [pdfLoaded, setPdfLoaded] = useState(false);

  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const viewerRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfOverlayRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pageHeight, setPageHeight] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const handleFieldSelection = (fieldType: string) => {
    setSelectedField(selectedField === fieldType ? null : fieldType);
    setIsSidebarOpen(false); // Close sidebar when field is selected
  };

  // Request notification permission on component mount
  React.useEffect(() => {
    requestNotificationPermission();
  }, []);

  const addRecipient = () => {
    const newRecipient: Recipient = {
      id: Date.now().toString(),
      name: "Full name",
      email: "email@example.com",
      role: "signer",
    };
    setRecipients([...recipients, newRecipient]);
  };

  const updateRecipient = (id: string, updates: Partial<Recipient>) => {
    setRecipients(
      recipients.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const removeRecipient = (id: string) => {
    setRecipients(recipients.filter((r) => r.id !== id));
    setDocumentFields(documentFields.filter((f) => f.recipientId !== id));
  };

  // Enhanced PDF load handler with proper single page support
  const handleDocumentLoad = (e: any) => {
    const doc = e.doc;
    const numPages = doc.numPages;
    setTotalPages(numPages);

    // Get dimensions for all pages
    const heights: { [key: number]: number } = {};

    // Load first page for initial setup
    doc.getPage(1).then((page: any) => {
      const viewport = page.getViewport({ scale: 1 });

      setPdfDimensions({
        width: viewport.width,
        height: viewport.height,
      });

      setViewerDimensions({
        width: viewport.width,
        height: viewport.height,
      });

      setPageHeight(viewport.height);
      setPageWidth(viewport.width);

      heights[1] = viewport.height;

      // For single page PDF, set pageHeights immediately
      if (numPages === 1) {
        setPageHeights(heights);
        setPdfLoaded(true);
        console.log("Single page PDF loaded:", { heights, numPages });
      } else {
        // Load remaining pages for multi-page PDFs
        let pagesLoaded = 1;
        for (let i = 2; i <= numPages; i++) {
          doc.getPage(i).then((page: any) => {
            const viewport = page.getViewport({ scale: 1 });
            heights[i] = viewport.height;
            pagesLoaded++;

            // Set pageHeights when all pages are loaded
            if (pagesLoaded === numPages) {
              setPageHeights(heights);
              setPdfLoaded(true);
              console.log("Multi-page PDF loaded:", { heights, numPages });
            }
          });
        }
      }
    });
  };

  // Function to determine which page a Y coordinate belongs to
  const getPageFromY = (y: number): number => {
    let accumulatedHeight = 0;
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const currentPageHeight = pageHeights[pageNum] || pageHeight;
      if (y <= accumulatedHeight + currentPageHeight) {
        return pageNum;
      }
      accumulatedHeight += currentPageHeight;
    }
    return totalPages; // Default to last page if calculation fails
  };

  // Function to get Y coordinate relative to specific page
  const getRelativeY = (absoluteY: number, pageNumber: number): number => {
    let accumulatedHeight = 0;
    for (let i = 1; i < pageNumber; i++) {
      accumulatedHeight += pageHeights[i] || pageHeight;
    }
    return absoluteY - accumulatedHeight;
  };

  // Function to get absolute Y coordinate from page-relative Y
  const getAbsoluteY = (relativeY: number, pageNumber: number): number => {
    let accumulatedHeight = 0;
    for (let i = 1; i < pageNumber; i++) {
      accumulatedHeight += pageHeights[i] || pageHeight;
    }
    return accumulatedHeight + relativeY;
  };

  // Update field positions on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setScrollPosition(containerRef.current.scrollTop);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Adjust field positions based on scroll and scale
  const getAdjustedPosition = (field: DocumentField) => {
    return {
      x: field.x * scale,
      y: (field.y - scrollPosition) * scale,
      width: field.width * scale,
      height: field.height * scale,
    };
  };

  // Enhanced document click handler with improved PDF support
  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log("Document click detected", {
      selectedField,
      pdfLoaded,
      totalPages,
      pageHeights,
      target: e.target,
      currentTarget: e.currentTarget,
    });

    if (!selectedField) {
      console.log("No field selected, ignoring click");
      return;
    }

    // For PDF documents, ensure it's loaded before processing clicks
    if (
      template.fileUrl &&
      template.fileType === "application/pdf" &&
      !pdfLoaded
    ) {
      console.log("PDF not fully loaded yet, ignoring click");
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const scrollTop = containerRef.current?.scrollTop || 0;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top + scrollTop;

    const x = rawX / scale; // normalize based on zoom
    const y = rawY / scale;

    console.log("Click coordinates:", { x, y, rect });

    // For PDF documents, calculate page number and relative Y position
    let pageNumber = 1;
    let relativeY = y;

    if (template.fileUrl && template.fileType === "application/pdf") {
      pageNumber = getPageFromY(y);
      relativeY = getRelativeY(y, pageNumber);
      console.log("PDF click processing:", {
        pageNumber,
        relativeY,
        absoluteY: y,
      });
    }

    const newField: DocumentField = {
      id: Date.now().toString(),
      type: selectedField,
      x,
      y,
      width:
        selectedField === "signature"
          ? 200
          : selectedField === "checkbox"
          ? 20
          : 150,
      height:
        selectedField === "signature"
          ? 60
          : selectedField === "checkbox"
          ? 20
          : 30,
      recipientId: recipients[0]?.id || "",
      required: true,
      pageNumber:
        template.fileUrl && template.fileType === "application/pdf"
          ? pageNumber
          : 1,
    };

    console.log("Creating new field:", newField);

    setDocumentFields([...documentFields, newField]);
    setSelectedField(null);
  };

  const handleFieldDrag = (fieldId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const field = documentFields.find((f) => f.id === fieldId);
    if (!field) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const docRect = (
      pdfOverlayRef.current || document.querySelector(".document-area")
    )?.getBoundingClientRect();
    if (!docRect) return;

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDraggedField(fieldId);
    setDragOffset({ x: offsetX, y: offsetY });

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX - docRect.left - offsetX;
      const y = e.clientY - docRect.top - offsetY;
      const newPageNumber = getPageFromY(y);

      setDocumentFields((fields) =>
        fields.map((f) =>
          f.id === fieldId
            ? {
                ...f,
                x: Math.max(0, Math.min(x, docRect.width - f.width - 20)),
                y: Math.max(0, Math.min(y, docRect.height - f.height - 20)),
                pageNumber: newPageNumber,
              }
            : f
        )
      );
    };

    const handleMouseUp = () => {
      setDraggedField(null);
      setDragOffset({ x: 0, y: 0 });
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const removeField = (fieldId: string) => {
    setDocumentFields(documentFields.filter((f) => f.id !== fieldId));
  };

  // Enhanced function to duplicate field across all pages with proper bottom-relative positioning
  const duplicateFieldToAllPages = (fieldId: string) => {
    const sourceField = documentFields.find((f) => f.id === fieldId);
    if (
      !sourceField ||
      !template.fileUrl ||
      template.fileType !== "application/pdf"
    ) {
      return;
    }

    const sourcePageNumber = sourceField.pageNumber || 1;
    const sourcePageHeight = pageHeights[sourcePageNumber] || pageHeight;

    // Calculate distance from bottom of source page
    const sourceRelativeY = getRelativeY(sourceField.y, sourcePageNumber);
    const distanceFromBottom =
      sourcePageHeight - (sourceRelativeY + sourceField.height);

    console.log("Source field positioning:", {
      sourcePageNumber,
      sourcePageHeight,
      sourceRelativeY,
      fieldHeight: sourceField.height,
      distanceFromBottom,
    });

    // Create new fields for all other pages
    const newFields: DocumentField[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (pageNum === sourcePageNumber) continue; // Skip the source page

      const targetPageHeight = pageHeights[pageNum] || pageHeight;

      // Calculate Y position based on distance from bottom
      const targetRelativeY =
        targetPageHeight - distanceFromBottom - sourceField.height;
      const targetAbsoluteY = getAbsoluteY(targetRelativeY, pageNum);

      console.log(`Target page ${pageNum} positioning:`, {
        targetPageHeight,
        targetRelativeY,
        targetAbsoluteY,
        distanceFromBottom,
      });

      // Check if there's already a field at this position on this page
      const existingField = documentFields.find(
        (f) =>
          f.pageNumber === pageNum &&
          f.type === sourceField.type &&
          f.recipientId === sourceField.recipientId &&
          Math.abs(f.x - sourceField.x) < 10 && // Within 10px tolerance
          Math.abs(getRelativeY(f.y, f.pageNumber || 1) - targetRelativeY) < 10
      );

      if (existingField) continue; // Skip if field already exists at this position

      const newField: DocumentField = {
        id: `${fieldId}-page-${pageNum}-${Date.now()}`,
        type: sourceField.type,
        x: sourceField.x,
        y: Math.max(0, targetAbsoluteY), // Ensure Y is not negative
        width: sourceField.width,
        height: sourceField.height,
        recipientId: sourceField.recipientId,
        required: sourceField.required,
        pageNumber: pageNum,
        // Copy signature data if it exists
        signedData: sourceField.signedData
          ? { ...sourceField.signedData }
          : undefined,
      };

      newFields.push(newField);
    }

    if (newFields.length > 0) {
      setDocumentFields([...documentFields, ...newFields]);

      // Show success message
      setSaveStatus({
        show: true,
        success: true,
        message: `Field duplicated to ${newFields.length} page${
          newFields.length !== 1 ? "s" : ""
        } at the same distance from bottom!`,
      });
    } else {
      setSaveStatus({
        show: true,
        success: false,
        message:
          "No new pages to duplicate to (fields may already exist at this position)",
      });
    }
  };

  const handleDownload = async () => {
    try {
      // For text documents (non-PDF)
      if (!template.fileUrl || template.fileType !== "application/pdf") {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4 size in points
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const title = template.title || "Untitled Document";
        page.drawText(title, {
          x: 50,
          y: 820,
          size: 18,
          font,
        });

        const lines = (template.content || "").split("\n");
        let y = 790;

        const maxWidth = 495; // page width (595) - margin (50 * 2)
        const fontSize = 12;
        function wrapText(
          text: string,
          font: PDFFont,
          fontSize: number,
          maxWidth: number
        ): string[] {
          const words = text.split(" ");
          const lines: string[] = [];
          let currentLine = "";

          for (const word of words) {
            const lineTest = currentLine ? `${currentLine} ${word}` : word;
            const width = font.widthOfTextAtSize(lineTest, fontSize);
            if (width < maxWidth) {
              currentLine = lineTest;
            } else {
              if (currentLine) lines.push(currentLine);
              currentLine = word;
            }
          }

          if (currentLine) lines.push(currentLine);
          return lines;
        }

        for (const line of lines) {
          const wrappedLines = wrapText(line, font, fontSize, maxWidth);
          for (const wrappedLine of wrappedLines) {
            if (y < 50) break; // avoid bottom margin
            page.drawText(wrappedLine, {
              x: 50,
              y,
              size: fontSize,
              font,
            });
            y -= 21;
          }
        }

        const pageWidth = 595;
        const pageHeight = 842;

        for (const field of documentFields) {
          if (!field.signedData) continue;

          const xPos = field.x;
          const yPos = pageHeight - field.y - field.height;

          if (field.type === "signature") {
            if (
              field.signedData.type === "draw" ||
              field.signedData.type === "upload"
            ) {
              try {
                const imageData = field.signedData.data;
                const base64Data = imageData.split(",")[1];
                const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
                  c.charCodeAt(0)
                ).buffer;

                const embedImage = imageData.startsWith("data:image/png")
                  ? await pdfDoc.embedPng(imageBytes)
                  : await pdfDoc.embedJpg(imageBytes);

                page.drawImage(embedImage, {
                  x: xPos,
                  y: yPos,
                  width: field.width,
                  height: field.height,
                });
              } catch (error) {
                console.error("Error embedding signature image:", error);
                page.drawText("SIGNATURE", {
                  x: xPos,
                  y: yPos + field.height / 2,
                  size: Math.min(field.height * 0.6, 12),
                  font,
                });
              }
            } else if (field.signedData.type === "type") {
              try {
                const { text } = JSON.parse(field.signedData.data);
                const fontSize = Math.min(field.height * 0.7, 14);
                page.drawText(text, {
                  x: xPos,
                  y: yPos + (field.height - fontSize) / 2,
                  size: fontSize,
                  font,
                });
              } catch (err) {
                console.error("Typed signature error:", err);
              }
            }
          }
        }

        const pdfBytes = await pdfDoc.save();
        downloadPDF(
          pdfBytes,
          `${template.documentTitle || "document"}_signed.pdf`
        );

        setSaveStatus({
          show: true,
          success: true,
          message: "Text document signed and downloaded successfully",
        });
        return; // Stop execution for the PDF flow
      }

      // For PDF documents - use the same logic as generateSignedPDF
      const existingPdfBytes = await fetch(template.fileUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();

      console.log("Total pages in PDF:", pages.length);
      console.log("Fields to process:", documentFields.length);

      // Get sidebar width (adjust this value based on your actual sidebar width)
      const sidebarWidth = isSidebarOpen ? 320 : 0; // 320px when open, 0 when closed

      // Group fields by page
      const fieldsByPage: { [key: number]: DocumentField[] } = {};
      documentFields.forEach((field) => {
        if (!field.signedData) return;

        const pageNum = field.pageNumber || 1;
        if (!fieldsByPage[pageNum]) {
          fieldsByPage[pageNum] = [];
        }
        fieldsByPage[pageNum].push(field);
      });

      console.log("Fields grouped by page:", fieldsByPage);

      // Process each page that has fields
      for (const [pageNumStr, pageFields] of Object.entries(fieldsByPage)) {
        const pageNum = parseInt(pageNumStr);
        const page = pages[pageNum - 1]; // Pages are 0-indexed in pdf-lib

        if (!page) {
          console.warn(`Page ${pageNum} not found in PDF`);
          continue;
        }

        // Get page dimensions
        const { width: pdfWidth, height: pdfHeight } = page.getSize();

        console.log(`Processing page ${pageNum} - PDF Dimensions:`, {
          pdfWidth,
          pdfHeight,
        });

        // Find the PDF viewer container to get actual rendered dimensions
        const pdfViewer = document.querySelector(".rpv-core__viewer-layer");
        const pdfPageElements = document.querySelectorAll(
          ".rpv-core__page-layer"
        );

        let actualViewerWidth = pageWidth;
        let actualViewerHeight = pageHeights[pageNum] || pageHeight;

        if (pdfPageElements[pageNum - 1]) {
          const pageRect = pdfPageElements[pageNum - 1].getBoundingClientRect();
          actualViewerWidth = pageRect.width;
          actualViewerHeight = pageRect.height;
          console.log(`Page ${pageNum} rendered dimensions:`, {
            width: actualViewerWidth,
            height: actualViewerHeight,
          });
        }

        // Calculate proper scaling factors for this page
        const scaleX = pdfWidth / actualViewerWidth;
        const scaleY = pdfHeight / actualViewerHeight;

        console.log(`Page ${pageNum} scale factors:`, { scaleX, scaleY });

        // Add each field to this page
        for (const field of pageFields) {
          // Adjust X coordinate by subtracting sidebar width
          const adjustedViewerX = field.x - sidebarWidth;

          // Calculate normalized coordinates accounting for sidebar
          const normalizedX = (adjustedViewerX / actualViewerWidth) * pdfWidth;
          const normalizedY = (field.y / actualViewerHeight) * pdfHeight;

          // For multi-page documents, adjust Y position relative to the current page
          const yOnPage = normalizedY - (pageNum - 1) * pdfHeight;
          let adjustedY = pdfHeight - yOnPage - field.height;
          let adjustedX = normalizedX;

          // Clip to avoid out-of-bound placement
          if (adjustedX < 0) adjustedX = 0;
          if (adjustedX + field.width > pdfWidth)
            adjustedX = pdfWidth - field.width;
          if (adjustedY < 0) adjustedY = 0;
          if (adjustedY + field.height > pdfHeight)
            adjustedY = pdfHeight - field.height;

          console.log(`Field ${field.id} positioning on page ${pageNum}:`, {
            originalX: field.x,
            originalY: field.y,
            adjustedViewerX,
            normalizedX,
            normalizedY,
            adjustedX,
            adjustedY,
            pdfWidth,
            pdfHeight,
            sidebarWidth,
          });

          if (field.type === "signature" && field.signedData) {
            switch (field.signedData.type) {
              case "draw":
              case "upload":
                try {
                  // Handle different image formats
                  const imageData = field.signedData.data;
                  let imageBytes: ArrayBuffer;
                  let embedImage: any;

                  if (imageData.startsWith("data:image/png")) {
                    // Handle base64 PNG
                    const base64Data = imageData.split(",")[1];
                    imageBytes = Uint8Array.from(atob(base64Data), (c) =>
                      c.charCodeAt(0)
                    ).buffer;
                    embedImage = await pdfDoc.embedPng(imageBytes);
                  } else if (
                    imageData.startsWith("data:image/jpeg") ||
                    imageData.startsWith("data:image/jpg")
                  ) {
                    // Handle base64 JPEG
                    const base64Data = imageData.split(",")[1];
                    imageBytes = Uint8Array.from(atob(base64Data), (c) =>
                      c.charCodeAt(0)
                    ).buffer;
                    embedImage = await pdfDoc.embedJpg(imageBytes);
                  } else {
                    // Try to fetch as URL
                    imageBytes = await fetch(imageData).then((res) =>
                      res.arrayBuffer()
                    );
                    embedImage = await pdfDoc.embedPng(imageBytes);
                  }

                  // Calculate how close the field is to the right edge in the DOM viewer
                  // Calculate distances and PDF orientation
                  const distanceFromRightEdge = pdfWidth - field.x;
                  const isNearRightEdge = distanceFromRightEdge < 200;
                  const isNarrowPDF = pdfHeight > pdfWidth;

                  // Determine final X based on all conditions
                  let finalX;

                  if (isNarrowPDF) {
                    if (field.x > pdfWidth) {
                      // Avoid shifting if field.x exceeds actual page width
                      finalX = adjustedX;
                    } else {
                      finalX = adjustedX - 150;
                    }
                  } else {
                    finalX = isNearRightEdge ? adjustedX : adjustedX - 150;
                  }

                  // Draw signature image
                  page.drawImage(embedImage, {
                    x: finalX,
                    y: adjustedY + 50,
                    width: field.width,
                    height: field.height,
                  });

                  console.log(
                    `Successfully embedded signature image on page ${pageNum}`
                  );
                } catch (error) {
                  console.error(
                    `Error embedding signature image on page ${pageNum}:`,
                    error
                  );
                  // Fallback to text
                  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                  page.drawText("SIGNATURE", {
                    x: adjustedX,
                    y: adjustedY - field.height / 2,
                    size: Math.min(field.height * 0.6, 12),
                    font: font,
                  });
                }
                break;

              case "type":
                try {
                  const { text, font: fontFamily } = JSON.parse(
                    field.signedData.data
                  );
                  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

                  // Calculate appropriate font size
                  const fontSize = Math.min(field.height * 0.7, 14);

                  page.drawText(text, {
                    x: adjustedX,
                    y: adjustedY + (field.height - fontSize) / 2, // Center vertically
                    size: fontSize,
                    font: font,
                  });

                  console.log(
                    `Successfully added typed signature on page ${pageNum}`
                  );
                } catch (error) {
                  console.error(
                    `Error adding typed signature on page ${pageNum}:`,
                    error
                  );
                  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                  page.drawText("SIGNATURE", {
                    x: adjustedX,
                    y: adjustedY + field.height / 2,
                    size: Math.min(field.height * 0.6, 12),
                    font: font,
                  });
                }
                break;
            }
          }
        }
      }

      // Save and download
      const pdfBytes = await pdfDoc.save();
      downloadPDF(pdfBytes, `${documentTitle || "document"}_signed.pdf`);

      setSaveStatus({
        show: true,
        success: true,
        message: "Document downloaded successfully with signatures",
      });
    } catch (error) {
      console.error("Download failed:", error);
      setSaveStatus({
        show: true,
        success: false,
        message: "Failed to download document with signatures",
      });
    }
  };

  // Helper function to trigger download
  const downloadPDF = (pdfBytes: Uint8Array, filename: string) => {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSaveSignature = (signature: SavedSignature) => {
    setSavedSignatures([...savedSignatures, signature]);

    // If we're signing a specific field, apply the signature
    if (currentSigningField) {
      setDocumentFields((fields) =>
        fields.map((f) =>
          f.id === currentSigningField ? { ...f, signedData: signature } : f
        )
      );
      setCurrentSigningField(null);
    }

    setShowSignatureModal(false);
    setShowSignatureInterface(false);
  };

  const handleFieldClick = (fieldId: string, fieldType: string) => {
    if (fieldType === "signature") {
      setCurrentSigningField(fieldId);
      setShowSignatureModal(true);
    }
  };

  const clearFieldSignature = (fieldId: string) => {
    setDocumentFields((fields) =>
      fields.map((f) =>
        f.id === fieldId ? { ...f, signedData: undefined } : f
      )
    );
  };
  useEffect(() => {
    console.log(template, "thisfkshkfh");
    if (template?.fields) {
      setDocumentFields(template.fields);
    }
  }, [template]);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setSaveStatus({
        show: true,
        success: false,
        message: "Please enter a template name",
      });
      return;
    }

    try {
      const newTemplate: Template = {
        title: templateName,
        description: templateDescription || `Custom template: ${templateName}`,
        content: documentContent,
        fields: documentFields,
        recipients,
        fileUrl: template.fileUrl,
        fileType: template.fileType,
        category: "Custom",
        createdAt: new Date().toISOString(),
      };
      console.log("🚀 Saving template with fields:", documentFields);

      const response = await fetch(`${API_URL}/api/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      });

      if (!response.ok) throw new Error("Save failed");

      setSaveStatus({
        show: true,
        success: true,
        message: "Template saved successfully!",
      });

      setTemplateName("");
      setTemplateDescription("");
      setShowSaveModal(false);
    } catch (error) {
      setSaveStatus({
        show: true,
        success: false,
        message: "Failed to save template. Please try again.",
      });
    }
  };

  const renderFieldContent = (field: DocumentField) => {
    if (field.signedData && field.type === "signature") {
      // Render the actual signature
      switch (field.signedData.type) {
        case "draw":
        case "upload":
          return (
            <img
              src={field.signedData.data}
              alt="Signature"
              className="max-w-full max-h-full object-contain"
              style={{
                filter: "brightness(0) saturate(100%)",
                mixBlendMode: "multiply",
              }}
            />
          );
        case "type":
          const { text, font } = JSON.parse(field.signedData.data);
          return (
            <div
              className="text-lg font-medium text-black"
              style={{ fontFamily: font }}
            >
              {text}
            </div>
          );
        default:
          return null;
      }
    }

    // Default field display
    return (
      <div className="flex items-center space-x-1">
        {getFieldIcon(field.type)}
        <span className="capitalize">{field.type}</span>
        {field.pageNumber && (
          <span className="text-xs bg-gray-200 px-1 rounded">
            P{field.pageNumber}
          </span>
        )}
      </div>
    );
  };

  const handleSendForSignature = async (sendData: SendData) => {
    setIsSending(true);

    try {
      const emailData = {
        subject: sendData.subject,
        message: sendData.message,
        documentTitle: template.title,
        senderName: "Document Sender",
      };

      const result = await fetch(`${API_URL}/api/signatures/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: sendData.recipients,
          subject: sendData.subject,
          message: sendData.message,
          documentTitle: template.title,
          documentContent: template.content, // Add the raw text content
          fields: documentFields,
          fileUrl: template.fileUrl || null, // Optional if you have a file
          fileType: template.fileType || "text/plain", // Default to text
        }),
      });

      const json = await result.json();
      console.log("Signature sent:", json);

      setSendStatus({
        show: true,
        success: json.success === true,
        message: json.success
          ? "Signature request sent successfully!"
          : "Failed to send signature requests",
        details: json.id ? `Tracking ID: ${json.id}` : undefined,
      });

      if (json.success) {
        setShowSendModal(false);
      }
    } catch (error) {
      setSendStatus({
        show: true,
        success: false,
        message: "Failed to send signature requests",
        details: "Please try again later",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case "signature":
        return <PenTool className="w-4 h-4" />;
      case "date":
        return <Calendar className="w-4 h-4" />;
      case "text":
        return <Type className="w-4 h-4" />;
      case "checkbox":
        return <CheckSquare className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getFieldColor = (type: string) => {
    switch (type) {
      case "signature":
        return "border-blue-500 bg-blue-50";
      case "date":
        return "border-green-500 bg-green-50";
      case "text":
        return "border-purple-500 bg-purple-50";
      case "checkbox":
        return "border-orange-500 bg-orange-50";
      default:
        return "border-gray-500 bg-gray-50";
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={onBack}
                  className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Templates
                </button>
                <Edit className="w-6 h-6 text-blue-600 mr-2" />
                <span className="text-lg font-semibold text-gray-900">
                  {documentTitle}
                </span>
                {totalPages > 1 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({totalPages} pages)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsEditingDocument(!isEditingDocument)}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Document
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </button>
                <button
                  onClick={() => setShowSendModal(true)}
                  disabled={isValidating || isSending}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isValidating
                    ? "Validating..."
                    : isSending
                    ? "Sending..."
                    : "Send for Signature"}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex h-[calc(100vh-4rem)]">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute left-0 top-4 z-10 p-2 bg-white rounded-r-lg shadow-sm border border-gray-200 border-l-0 hover:bg-gray-50"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}
          {/* Left Sidebar */}
          {isSidebarOpen && (
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
              {/* Add Fields Section */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add Fields
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleFieldSelection("signature")}
                    className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
                      selectedField === "signature"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <PenTool className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Signature</span>
                  </button>

                  <button
                    onClick={() => handleFieldSelection("date")}
                    className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
                      selectedField === "date"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <Calendar className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Date</span>
                  </button>

                  <button
                    onClick={() =>
                      setSelectedField(selectedField === "text" ? null : "text")
                    }
                    className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
                      selectedField === "text"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <Type className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Text</span>
                  </button>

                  <button
                    onClick={() =>
                      setSelectedField(
                        selectedField === "checkbox" ? null : "checkbox"
                      )
                    }
                    className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
                      selectedField === "checkbox"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <CheckSquare className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Checkbox</span>
                  </button>
                </div>

                {selectedField && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Click on the document to place a {selectedField} field
                      {totalPages > 1 && " on any page"}
                    </p>
                  </div>
                )}
              </div>

              {/* Multi-page Features */}
              {totalPages > 1 && (
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Multi-Page Tools
                  </h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-purple-800 mb-2">
                      💡 <strong>Tip:</strong> Use "Duplicate to All Pages" on
                      any field to copy it to the same position relative to the
                      bottom of each page.
                    </p>
                    <p className="text-xs text-purple-600">
                      Perfect for signatures, initials, or date fields that need
                      to appear consistently across all pages.
                    </p>
                  </div>
                </div>
              )}

              {/* Page Overview */}
              {totalPages > 1 && (
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Page Overview
                  </h3>
                  <div className="space-y-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNum) => {
                        const pageFields = documentFields.filter(
                          (f) => f.pageNumber === pageNum
                        );
                        return (
                          <div
                            key={pageNum}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-600">
                              Page {pageNum}
                            </span>
                            <span className="text-gray-500">
                              {pageFields.length} field
                              {pageFields.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* Recipients Section */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recipients
                  </h3>
                  <button
                    onClick={addRecipient}
                    className="flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>

                <div className="space-y-3">
                  {recipients.map((recipient, index) => (
                    <div
                      key={recipient.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-700">
                            Recipient {index + 1}
                          </span>
                        </div>
                        {recipients.length > 1 && (
                          <button
                            onClick={() => removeRecipient(recipient.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {isEditingRecipient === recipient.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={recipient.name}
                            onChange={(e) =>
                              updateRecipient(recipient.id, {
                                name: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="Full name"
                          />
                          <input
                            type="email"
                            value={recipient.email}
                            onChange={(e) =>
                              updateRecipient(recipient.id, {
                                email: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="email@example.com"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setIsEditingRecipient(null);
                                setIsSidebarOpen(false);
                              }}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingRecipient(null);
                                setIsSidebarOpen(false);
                              }}
                              className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setIsEditingRecipient(recipient.id)}
                          className="cursor-pointer"
                        >
                          <p className="text-sm text-gray-900">
                            {recipient.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {recipient.email}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <select
                              value={recipient.role}
                              onChange={(e) =>
                                updateRecipient(recipient.id, {
                                  role: e.target.value as "signer" | "viewer",
                                })
                              }
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="signer">Signer</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <span className="text-xs text-gray-500">
                              {
                                documentFields.filter(
                                  (f) => f.recipientId === recipient.id
                                ).length
                              }{" "}
                              fields
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Document Area */}
          <div className=" flex-1 overflow-auto">
            <div className="p-8">
              <div
                className="document-area bg-white shadow-lg rounded-lg min-h-[800px] relative cursor-crosshair"
                onClick={handleDocumentClick}
                style={{ cursor: selectedField ? "crosshair" : "default" }}
              >
                {isEditingDocument ? (
                  <div className="p-8 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Title
                      </label>
                      <input
                        type="text"
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Content
                      </label>
                      <textarea
                        value={documentContent}
                        onChange={(e) => setDocumentContent(e.target.value)}
                        rows={20}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      />
                    </div>
                    <button
                      onClick={() => setIsEditingDocument(false)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Done Editing
                    </button>
                  </div>
                ) : (
                  <div className="p-8 relative">
                    {/* Show uploaded file if available */}
                    {template.fileUrl && template.fileType ? (
                      <div className="mb-6">
                        {template.fileType === "application/pdf" ? (
                          <div className="relative bg-white border-2 border-gray-300 rounded-lg min-h-[800px] flex flex-col">
                            {/* PDF Container with overlay */}
                            <div className="relative">
                              {/* PDF Viewer */}
                              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                                <div
                                  style={{
                                    height: "100%",
                                    width: "100%",
                                    position: "relative",
                                    overflow: "auto",
                                  }}
                                  ref={containerRef}
                                >
                                  <Viewer
                                    fileUrl={template.fileUrl}
                                    plugins={[defaultLayoutPluginInstance]}
                                    defaultScale={1.0} // Fixed zoom level
                                    // or use: defaultScale={SpecialZoomLevel.PageWidth}
                                    onDocumentLoad={handleDocumentLoad}
                                    onZoom={(zoom) => setScale(zoom.scale)}
                                  />

                                  {/* Overlay div for capturing clicks */}
                                  <div
                                    className="absolute inset-0 pointer-events-auto"
                                    onClick={handleDocumentClick}
                                    style={{
                                      cursor: selectedField
                                        ? "crosshair"
                                        : "default",
                                      zIndex: 10,
                                    }}
                                  />
                                </div>
                              </Worker>

                              {/* Overlay div for capturing clicks */}
                              <div
                                className="absolute inset-0 pointer-events-auto"
                                onClick={handleDocumentClick}
                                style={{
                                  cursor: selectedField
                                    ? "crosshair"
                                    : "default",
                                  zIndex: 10,
                                }}
                              >
                                {/* This div will capture all clicks */}
                              </div>

                              {/* Signature fields will be rendered here */}
                              {!isEditingDocument &&
                                documentFields.map((field) => (
                                  <div
                                    key={field.id}
                                    className={`absolute group ${
                                      field.signedData
                                        ? "bg-transparent cursor-move"
                                        : `border-2 ${getFieldColor(
                                            field.type
                                          )} ${
                                            field.type === "signature"
                                              ? "cursor-pointer hover:shadow-lg"
                                              : "cursor-move"
                                          }`
                                    } flex items-center justify-center text-xs font-medium transition-all duration-200`}
                                    style={{
                                      left: field.x,
                                      top: field.y,
                                      width: field.width,
                                      height: field.height,
                                      zIndex:
                                        draggedField === field.id ? 1000 : 20,
                                    }}
                                    onMouseDown={(e) =>
                                      handleFieldDrag(field.id, e)
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (
                                        field.type === "signature" &&
                                        !field.signedData &&
                                        !draggedField
                                      ) {
                                        handleFieldClick(field.id, field.type);
                                      }
                                    }}
                                  >
                                    {renderFieldContent(field)}

                                    {/* Control buttons - enhanced with duplicate functionality */}
                                    <div className="absolute -top-8 left-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded shadow-lg p-1 z-10">
                                      {/* Duplicate to all pages button - only for PDF with multiple pages */}
                                      {totalPages > 1 &&
                                        template.fileType ===
                                          "application/pdf" && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              e.preventDefault();
                                              duplicateFieldToAllPages(
                                                field.id
                                              );
                                            }}
                                            className="w-6 h-6 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 flex items-center justify-center"
                                            title="Duplicate to all pages (same distance from bottom)"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </button>
                                        )}

                                      {/* Clear signature button - only for signed fields */}
                                      {field.signedData && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            clearFieldSignature(field.id);
                                          }}
                                          className="w-6 h-6 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 flex items-center justify-center"
                                          title="Clear signature"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}

                                      {/* Change signature button - only for signature fields */}
                                      {field.type === "signature" && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            handleFieldClick(
                                              field.id,
                                              field.type
                                            );
                                          }}
                                          className="w-6 h-6 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center justify-center"
                                          title={
                                            field.signedData
                                              ? "Change signature"
                                              : "Add signature"
                                          }
                                        >
                                          <Edit className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>

                                    {/* Remove field button for unsigned fields */}
                                    {!field.signedData && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          removeField(field.id);
                                        }}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}

                                    {/* Recipient assignment */}
                                    {!field.signedData &&
                                      recipients.length > 1 && (
                                        <select
                                          value={field.recipientId}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            setDocumentFields((fields) =>
                                              fields.map((f) =>
                                                f.id === field.id
                                                  ? {
                                                      ...f,
                                                      recipientId:
                                                        e.target.value,
                                                    }
                                                  : f
                                              )
                                            );
                                          }}
                                          className="absolute -bottom-8 left-0 text-xs border border-gray-300 rounded px-2 py-1 bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {recipients.map((recipient) => (
                                            <option
                                              key={recipient.id}
                                              value={recipient.id}
                                            >
                                              {recipient.name}
                                            </option>
                                          ))}
                                        </select>
                                      )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      /* Regular text document */
                      <div className="px-8 py-8">
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
                            {documentTitle}
                          </h1>
                          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                            {documentContent}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Document Fields for text documents */}
                {!template.fileUrl &&
                  !isEditingDocument &&
                  documentFields.map((field) => (
                    <div
                      key={field.id}
                      className={`absolute group ${
                        field.signedData
                          ? "bg-transparent cursor-move"
                          : `border-2 ${getFieldColor(field.type)} ${
                              field.type === "signature"
                                ? "cursor-pointer hover:shadow-lg"
                                : "cursor-move"
                            }`
                      } flex items-center justify-center text-xs font-medium transition-all duration-200`}
                      style={{
                        left: field.x,
                        top: field.y,
                        width: field.width,
                        height: field.height,
                        zIndex: draggedField === field.id ? 1000 : 1,
                      }}
                      onMouseDown={(e) => {
                        handleFieldDrag(field.id, e);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          field.type === "signature" &&
                          !field.signedData &&
                          !draggedField
                        ) {
                          handleFieldClick(field.id, field.type);
                        }
                      }}
                    >
                      {renderFieldContent(field)}

                      {/* Control buttons - only show on hover for signed signatures */}
                      {field.signedData && (
                        <div className="absolute -top-8 left-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded shadow-lg p-1 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              clearFieldSignature(field.id);
                            }}
                            className="w-6 h-6 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 flex items-center justify-center"
                            title="Clear signature"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleFieldClick(field.id, field.type);
                            }}
                            className="w-6 h-6 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center justify-center"
                            title="Change signature"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Remove field button for unsigned fields */}
                      {!field.signedData && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            removeField(field.id);
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}

                      {/* Recipient assignment */}
                      {!field.signedData && recipients.length > 1 && (
                        <select
                          value={field.recipientId}
                          onChange={(e) => {
                            e.stopPropagation();
                            setDocumentFields((fields) =>
                              fields.map((f) =>
                                f.id === field.id
                                  ? { ...f, recipientId: e.target.value }
                                  : f
                              )
                            );
                          }}
                          className="absolute -bottom-8 left-0 text-xs border border-gray-300 rounded px-2 py-1 bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {recipients.map((recipient) => (
                            <option key={recipient.id} value={recipient.id}>
                              {recipient.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <SignatureModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onSave={handleSaveSignature}
          existingSignatures={savedSignatures}
        />

        <SendForSignatureModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onSend={handleSendForSignature}
          recipients={recipients}
          documentFields={documentFields}
          documentTitle={documentTitle}
          isSending={isSending}
        />

        {/* Success/Error Status Modal */}
        {sendStatus.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  {sendStatus.success ? (
                    <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {sendStatus.success ? "Success!" : "Error"}
                  </h3>
                </div>
                <p className="text-gray-600 mb-2">{sendStatus.message}</p>
                {sendStatus.details && (
                  <p className="text-sm text-gray-500 mb-4">
                    {sendStatus.details}
                  </p>
                )}
                {sendStatus.success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-800">
                      📧 Recipients will receive an email with a link to sign
                      the document
                    </p>
                    <p className="text-sm text-green-800 mt-1">
                      🔔 You'll be notified when they complete their signatures
                    </p>
                  </div>
                )}
                <button
                  onClick={() =>
                    setSendStatus({ show: false, success: false, message: "" })
                  }
                  className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Save as Template
              </h2>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe what this template is for..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Template will include:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Document content and title</li>
                  <li>
                    • {documentFields.length} field
                    {documentFields.length !== 1 ? "s" : ""} positioned on
                    document
                  </li>
                  <li>
                    • {recipients.length} recipient
                    {recipients.length !== 1 ? "s" : ""} configuration
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className={`px-6 py-2 rounded-lg font-medium ${
                  templateName.trim()
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Status Modal */}
      {saveStatus.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                {saveStatus.success ? (
                  <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {saveStatus.success ? "Template Saved!" : "Save Failed"}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">{saveStatus.message}</p>
              {saveStatus.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800">
                    💾 Your template has been saved and will appear in the
                    Template Library under "Custom" templates.
                  </p>
                </div>
              )}
              <button
                onClick={() =>
                  setSaveStatus({ show: false, success: false, message: "" })
                }
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentEditor;
