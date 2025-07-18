import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Send,
  FileText,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Calendar,
  Type,
  Square,
} from "lucide-react";
import SignatureModal, { SavedSignature } from "./SignatureModal";
import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { Menu, X } from "lucide-react";
const API_URL = import.meta.env.VITE_API_URL;

interface SignatureField {
  _id: string;
  id: string;
  type: "signature" | "date" | "text" | "checkbox";
  x: number;
  y: number;
  width: number;
  height: number;
  recipientId: string;
  required: boolean;
  pageNumber?: number;
  signedData?: {
    id: string;
    name: string;
    type: "draw" | "type" | "upload";
    data: string;
    createdAt: string;
  };
}

interface Recipient {
  _id: string;
  name: string;
  email: string;
  role: "signer" | "viewer";
  signed: boolean;
}

interface DocumentData {
  _id: string;
  documentTitle: string;
  subject: string;
  message: string;
  fileUrl: string;
  fileType: string;
  fields: SignatureField[];
  recipients: Recipient[];
  status: string;
  sentAt: string;
}

const SignDocumentPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [currentRecipient, setCurrentRecipient] = useState<Recipient | null>(
    null
  );
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [showFieldsOverlay, setShowFieldsOverlay] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  const [selectedFieldType, setSelectedFieldType] = useState<
    "signature" | "date" | "text" | "checkbox"
  >("signature");
  const [isPlacingField, setIsPlacingField] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
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

  // Load document data
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/signatures/${id}`);

        if (!response.ok) {
          throw new Error("Document not found");
        }

        const data = await response.json();
        setDocumentData(data);
        if (data.documentContent) {
          setTextContent(data.documentContent);
        }
        if (data.fileType === "text/plain") {
          if (data.documentContent) {
            setTextContent(data.documentContent);
          } else if (data.fileUrl) {
            // Fallback to fetching from fileUrl if documentContent missing
            const textRes = await fetch(data.fileUrl);
            const text = await textRes.text();
            setTextContent(text);
          } else {
            // Final fallback if neither exists
            setTextContent("Document content not available");
          }
        }
        console.log(data, "test document content");

        // For demo purposes, assume first recipient is current user
        // In real app, you'd identify the recipient by email/token
        if (data.recipients && data.recipients.length > 0) {
          setCurrentRecipient(data.recipients[0]);
          setSigned(data.recipients[0].signed);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load document"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id]);

  // Load saved signatures from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedSignatures") || "[]");
    setSavedSignatures(saved);
  }, []);

  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingField || signed) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Only allow placing signature fields for current recipient
    if (selectedFieldType === "signature" && currentRecipient) {
      const newField: SignatureField = {
        _id: Date.now().toString(),
        id: Date.now().toString(),
        type: selectedFieldType,
        x: x,
        y: y,
        width:
          selectedFieldType === "signature"
            ? 200
            : selectedFieldType === "date"
            ? 120
            : 150,
        height: selectedFieldType === "signature" ? 60 : 30,
        recipientId: currentRecipient._id,
        required: true,
        pageNumber: currentPage,
      };

      if (documentData) {
        setDocumentData({
          ...documentData,
          fields: [...documentData.fields, newField],
        });
      }

      setIsPlacingField(false);
    }
  };
  const handlePageChange = (e: { currentPage: number }) => {
    setCurrentPage(e.currentPage + 1); // PDF pages are 0-indexed in react-pdf-viewer
  };

  const handleFieldClick = (fieldId: string) => {
    if (signed) return; // Don't allow editing if already signed

    const field = documentData?.fields.find((f) => f.id === fieldId);
    if (field && field.type === "signature") {
      setSelectedFieldId(fieldId);
      setShowSignatureModal(true);
    }
  };

  const handleAddField = (type: "signature" | "date" | "text" | "checkbox") => {
    setSelectedFieldType(type);
    setIsPlacingField(true);
    setIsSidebarOpen(false);
  };

  const downloadPDF = (url: string, filename = "signed_document.pdf") => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSignatureSave = (signature: SavedSignature) => {
    if (!selectedFieldId || !documentData) return;

    // Update the field with signature data
    const updatedFields = documentData.fields.map((field) => {
      if (field.id === selectedFieldId) {
        return {
          ...field,
          signedData: {
            id: signature.id,
            name: signature.name,
            type: signature.type,
            data: signature.data,
            createdAt: signature.createdAt,
          },
        };
      }
      return field;
    });

    setDocumentData({
      ...documentData,
      fields: updatedFields,
    });

    // Save signature to localStorage if not already saved
    const existingSignatures = JSON.parse(
      localStorage.getItem("savedSignatures") || "[]"
    );
    const signatureExists = existingSignatures.some(
      (s: SavedSignature) => s.id === signature.id
    );

    if (!signatureExists) {
      const updatedSignatures = [...existingSignatures, signature];
      localStorage.setItem(
        "savedSignatures",
        JSON.stringify(updatedSignatures)
      );
      setSavedSignatures(updatedSignatures);
    }

    setShowSignatureModal(false);
    setSelectedFieldId(null);
  };

  const handleCompleteSignature = async () => {
    if (!documentData || !currentRecipient) return;

    try {
      setSigning(true);

      // Check if current recipient has signed all required fields
      const requiredFields = documentData.fields.filter(
        (f) => f.required && f.recipientId === currentRecipient._id
      );
      const signedFields = requiredFields.filter((f) => f.signedData);

      if (signedFields.length < requiredFields.length) {
        alert(
          "Please complete all required signature fields before submitting."
        );
        return;
      }
      const pageContainer = document.querySelectorAll(
        ".rpv-core__page-layer"
      )[0] as HTMLElement;
      const rect = pageContainer?.getBoundingClientRect();
      const renderedWidth = rect?.width || 800;
      const renderedHeight = rect?.height || 1035;
      const fieldsWithDimensions = documentData.fields.map((field) => ({
        ...field,
        renderedWidth,
        renderedHeight,
      }));
      // Send ALL signed fields to the backend, not just current recipient's
      const response = await fetch(`${API_URL}/api/signatures/${id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: currentRecipient._id,
          fields: fieldsWithDimensions.filter((f) => f.signedData),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("Failed to submit signature");
      }

      // Update the document data with the new signed version
      if (result.fileUrl) {
        setDocumentData((prev) =>
          prev ? { ...prev, fileUrl: result.fileUrl } : prev
        );

        // Trigger download automatically after signing
        downloadPDF(result.fileUrl, `${documentData.documentTitle}_signed.pdf`);
      }

      // Update recipient status
      setSigned(true);
      alert("Document signed successfully!");
    } catch (err) {
      alert("Failed to submit signature. Please try again.");
      console.error("Signing error:", err);
    } finally {
      setSigning(false);
    }
  };

  const renderSignatureField = (field: SignatureField) => {
    if (field.pageNumber !== currentPage) return null;
    if (field.pageNumber !== currentPage) return null;

    // Scale rendering based on page size (assuming 612x792 pt PDF pages)
    let container: HTMLElement | null = null;
    if (documentData.fileType === "application/pdf") {
      container = document.querySelectorAll(".rpv-core__page-layer")[
        currentPage - 1
      ] as HTMLElement;
    } else if (
      documentData.fileType === "text/plain" &&
      textContainerRef.current
    ) {
      container = textContainerRef.current;
    }

    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const scaleX = rect.width / 612;
    const scaleY = rect.height / 792;

    const isCurrentRecipientField = field.recipientId === currentRecipient?._id;
    const isSigned = !!field.signedData;

    return (
      <div
        key={field.id}
        className={`absolute border-2 border-dashed cursor-pointer transition-all duration-200 ${
          isSigned
            ? "border-green-500 bg-green-50"
            : isCurrentRecipientField
            ? "border-blue-500 bg-blue-50 hover:bg-blue-100"
            : "border-gray-400 bg-gray-50"
        } ${signed ? "cursor-not-allowed" : ""}`}
        style={{
          left: `${field.x}px`,
          top: `${field.y}px`,
          width: `${field.width}px`,
          height: `${field.height}px`,
        }}
        onClick={() =>
          isCurrentRecipientField && !signed && handleFieldClick(field.id)
        }
      >
        {isSigned && field.signedData ? (
          <div className="w-full h-full flex items-center justify-center p-1">
            {field.signedData.type === "draw" ||
            field.signedData.type === "upload" ? (
              <img
                src={field.signedData.data}
                alt="Signature"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div
                className="text-lg font-cursive text-center"
                style={{ fontFamily: "cursive" }}
              >
                {JSON.parse(field.signedData.data).text}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
            {isCurrentRecipientField ? (
              <span className="text-blue-600 font-medium">Click to Sign</span>
            ) : (
              <span>Signature Required</span>
            )}
          </div>
        )}

        {field.required && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">*</span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !documentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Document Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            {error || "The requested document could not be found."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/")}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </button>
              <FileText className="w-6 h-6 text-blue-600 mr-2" />
              <div>
                <span className="text-lg font-semibold text-gray-900">
                  {documentData.documentTitle}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  ({documentData.fields.length} field
                  {documentData.fields.length !== 1 ? "s" : ""})
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFieldsOverlay(!showFieldsOverlay)}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
              >
                {showFieldsOverlay ? (
                  <EyeOff className="w-4 h-4 mr-2" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                {showFieldsOverlay ? "Hide Fields" : "Show Fields"}
              </button>

              <a
                href={documentData.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>

              {!signed && currentRecipient && (
                <button
                  onClick={handleCompleteSignature}
                  disabled={signing}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {signing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {signing ? "Submitting..." : "Complete Signature"}
                </button>
              )}

              {signed && (
                <div className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Signed
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Status Banner */}
      {currentRecipient && (
        <div
          className={`${
            signed
              ? "bg-green-50 border-green-200"
              : "bg-blue-50 border-blue-200"
          } border-b px-4 py-3`}
        >
          <div className="max-w-7xl mx-auto flex items-center">
            <User
              className={`w-5 h-5 mr-3 ${
                signed ? "text-green-600" : "text-blue-600"
              }`}
            />
            <div>
              <p
                className={`text-sm font-medium ${
                  signed ? "text-green-800" : "text-blue-800"
                }`}
              >
                {signed ? "Document Completed" : "Signature Required"}
              </p>
              <p
                className={`text-xs ${
                  signed ? "text-green-600" : "text-blue-600"
                }`}
              >
                {signed
                  ? `You have successfully signed this document as ${currentRecipient.name}`
                  : `Please review and sign this document as ${currentRecipient.name}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer */}
      <main className=" px-8 sm:px-6 lg:px-8 py-8 overflow-hidden">
        <div className="flex h-[calc(100vh-4rem)]">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute left-0 top-20 z-10 p-2 bg-white rounded-r-lg shadow-sm border border-gray-200 border-l-0 hover:bg-gray-50"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}
          {/* Left Sidebar - Field Tools */}
          {isSidebarOpen && (
            <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Add Fields Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add Fields
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAddField("signature")}
                    className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
                      selectedFieldType === "signature" && isPlacingField
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    disabled={signed}
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Signature
                    </span>
                  </button>

                  <button
                    onClick={() => handleAddField("date")}
                    className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
                      selectedFieldType === "date" && isPlacingField
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    disabled={signed}
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Date
                    </span>
                  </button>

                  <button
                    onClick={() => handleAddField("text")}
                    className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
                      selectedFieldType === "text" && isPlacingField
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    disabled={signed}
                  >
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                      <Type className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Text
                    </span>
                  </button>

                  <button
                    onClick={() => handleAddField("checkbox")}
                    className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
                      selectedFieldType === "checkbox" && isPlacingField
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    disabled={signed}
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                      <Square className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Checkbox
                    </span>
                  </button>
                </div>

                {isPlacingField && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 Click anywhere on the document to place a{" "}
                      {selectedFieldType} field
                    </p>
                    <button
                      onClick={() => setIsPlacingField(false)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Current Recipient Info */}
              {currentRecipient && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Your Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">
                        {currentRecipient.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {currentRecipient.email}
                    </p>
                    <div className="mt-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          currentRecipient.role === "signer"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {currentRecipient.role}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Field Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Field Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Fields:</span>
                    <span className="font-medium">
                      {documentData.fields.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Your Fields:</span>
                    <span className="font-medium">
                      {
                        documentData.fields.filter(
                          (f) => f.recipientId === currentRecipient?._id
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium text-green-600">
                      {
                        documentData.fields.filter(
                          (f) =>
                            f.recipientId === currentRecipient?._id &&
                            f.signedData
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Document Area */}
          <div className="flex-1 overflow-auto">
            {" "}
            <div className="relative w-full">
              {/* PDF/Document Display */}
              {!documentData.fileUrl && documentData.documentContent ? (
                <div
                  className="relative bg-white h-[800px] overflow-auto px-8 py-8"
                  ref={textContainerRef}
                >
                  <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
                    {documentData.documentTitle}
                  </h1>
                  <div className="whitespace-pre-wrap font-sans text-gray-800  py-6">
                    {documentData.documentContent}
                  </div>

                  {showFieldsOverlay && (
                    <div
                      className="absolute inset-0"
                      onClick={handleDocumentClick}
                      style={{
                        pointerEvents: isPlacingField ? "auto" : "none",
                      }}
                    >
                      <div className="relative w-full h-full pointer-events-auto">
                        {documentData.fields.map(renderSignatureField)}
                      </div>
                    </div>
                  )}
                </div>
              ) : documentData.fileType === "application/pdf" ? (
                <div className="relative">
                  <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                    <div
                      style={{
                        height: "100%",
                        width: "100%",
                        position: "relative",
                        overflow: "auto",
                      }}
                      ref={containerRef}
                    ></div>

                    <Viewer
                      fileUrl={documentData.fileUrl}
                      plugins={[defaultLayoutPluginInstance]}
                      defaultScale={1.0}
                      enableSmoothScroll={true}
                      theme="light"
                      onPageChange={handlePageChange}
                      // onZoom={(zoom) => setScale(zoom.scale)}
                    />

                    {showFieldsOverlay && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        onClick={handleDocumentClick}
                        style={{
                          pointerEvents: isPlacingField ? "auto" : "none",
                        }}
                      >
                        <div className="px-8">
                          <div className="relative w-full h-full pointer-events-auto">
                            {documentData.fields.map(renderSignatureField)}
                          </div>
                        </div>
                      </div>
                    )}
                  </Worker>
                </div>
              ) : documentData.fileType === "text/plain" ? (
                <div className="relative p-8 bg-white h-[800px] overflow-auto font-mono whitespace-pre-wrap text-gray-800">
                  <iframe
                    src={documentData.fileUrl}
                    title="Text Document"
                    className="absolute top-0 left-0 w-full h-full opacity-0 pointer-events-none"
                  />
                  <div
                    className="absolute top-0 left-0 w-full h-full"
                    onClick={handleDocumentClick}
                    style={{
                      pointerEvents: isPlacingField ? "auto" : "none",
                    }}
                  >
                    {documentData.fields.map(renderSignatureField)}
                  </div>
                  <div className="relative z-0">
                    <object
                      data={documentData.fileUrl}
                      type="text/plain"
                      className="w-full"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      <p>Unable to display text file.</p>
                    </object>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={documentData.fileUrl}
                    alt="Document"
                    className="w-full max-w-none"
                  />
                  {showFieldsOverlay && (
                    <div
                      className="absolute inset-0"
                      onClick={handleDocumentClick}
                      style={{
                        pointerEvents: isPlacingField ? "auto" : "none",
                      }}
                    >
                      {documentData.fields.map(renderSignatureField)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Document Info */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Document Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Subject</p>
              <p className="text-sm text-gray-600">{documentData.subject}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Sent Date</p>
              <p className="text-sm text-gray-600">
                {new Date(documentData.sentAt).toLocaleDateString()}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-700">Message</p>
              <p className="text-sm text-gray-600">{documentData.message}</p>
            </div>
          </div>
        </div>

        {/* Recipients Status */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Signing Status
          </h3>
          <div className="space-y-3">
            {documentData.recipients.map((recipient) => (
              <div
                key={recipient._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {recipient.name}
                    </p>
                    <p className="text-xs text-gray-500">{recipient.email}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {recipient.signed ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">Signed</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false);
          setSelectedFieldId(null);
        }}
        onSave={handleSignatureSave}
        existingSignatures={savedSignatures}
      />
    </div>
  );
};

export default SignDocumentPage;
