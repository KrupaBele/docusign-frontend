import React, { useState, useRef } from "react";
import {
  ArrowLeft,
  Upload,
  FileText,
  Image,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";

interface DocumentUploaderProps {
  onBack: () => void;
  onContinue: (documentData: {
    title: string;
    content: string;
    fileUrl: string;
    fileType: string;
    file: File;
  }) => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onBack,
  onContinue,
}) => {
  const [documentTitle, setDocumentTitle] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [serverFileUrl, setServerFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadError("Please upload a PDF or image file (JPG, PNG, GIF, WebP)");
      setIsUploading(false);
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError("File size must be less than 10MB");
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("${API_URL/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.fileUrl) {
        throw new Error("Upload failed");
      }

      setUploadedFile(file);
      setServerFileUrl(data.fileUrl);

      if (!documentTitle) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setDocumentTitle(nameWithoutExt);
      }

      setIsUploading(false);
    } catch (error) {
      setUploadError("Upload failed. Please try again.");
      setIsUploading(false);
    }
  };

  const handleContinue = () => {
    if (!uploadedFile || !documentTitle.trim() || !serverFileUrl) return;

    onContinue({
      title: documentTitle,
      content:
        uploadedFile.type === "application/pdf"
          ? `PDF Document: ${uploadedFile.name}`
          : `Image Document: ${uploadedFile.name}`,
      fileUrl: serverFileUrl,
      fileType: uploadedFile.type,
      file: uploadedFile,
    });
  };

  const removeFile = () => {
    setUploadedFile(null);
    setServerFileUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isFormValid = uploadedFile && documentTitle.trim() && serverFileUrl;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <Upload className="w-6 h-6 text-blue-600 mr-2" />
            <span className="text-lg font-semibold text-gray-900">
              Upload Document
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Upload Document
            </h1>
            <p className="text-gray-600">
              Upload an existing document and add signature fields to it.
            </p>
          </div>

          <div className="px-8 py-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Select Document
              </h2>
              <p className="text-gray-600">
                Choose a PDF or image file to upload.
              </p>
            </div>

            {!uploadedFile ? (
              <div className="mb-6">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isUploading ? "Uploading..." : "Upload your document"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Drag and drop or click to select a file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {uploadError && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      <p className="text-sm text-red-700">{uploadError}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      {uploadedFile.type.startsWith("image/") ? (
                        <Image className="w-8 h-8 text-blue-600 mr-3" />
                      ) : (
                        <FileText className="w-8 h-8 text-red-600 mr-3" />
                      )}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {uploadedFile.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB •{" "}
                          {uploadedFile.type}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {serverFileUrl && (
                    <div className="mt-4">
                      {uploadedFile.type.startsWith("image/") ? (
                        <img
                          src={serverFileUrl}
                          alt="Document preview"
                          className="max-w-full max-h-64 object-contain border border-gray-200 rounded"
                        />
                      ) : (
                        <div className="h-64">
                          <iframe
                            src={serverFileUrl}
                            className="w-full h-full border border-gray-200 rounded"
                            title="Document preview"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <p className="text-sm text-green-800">
                        Document uploaded successfully! You can add signature
                        fields in the next step.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {uploadedFile && (
              <div className="mb-6">
                <label
                  htmlFor="document-title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Document Title
                </label>
                <input
                  id="document-title"
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Enter document title..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            )}
          </div>

          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={onBack}
              className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!isFormValid || isUploading}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isFormValid && !isUploading
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isUploading ? "Uploading..." : "Continue to Editor"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentUploader;
