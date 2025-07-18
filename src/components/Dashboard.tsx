import React, { useEffect, useState } from "react";
import {
  Upload,
  FileText,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  Download,
} from "lucide-react";

interface Recipient {
  name: string;
  email: string;
  signed: boolean;
}

interface Document {
  _id: string;
  documentTitle: string;
  recipients: Recipient[];
  status: "sent" | "completed" | string;
  sentAt: string;
  fileUrl?: string; // ✅ update to use `fileUrl`
}

interface DashboardProps {
  onChooseTemplate: () => void;
  onCreateFromScratch: () => void;
  onUploadDocument: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  onChooseTemplate,
  onCreateFromScratch,
  onUploadDocument,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "sent":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };
  const downloadPDF = async (url: string, filename: string) => {
    try {
      // Ensure the URL is absolute if it's relative
      const fullUrl = url.startsWith("http")
        ? url
        : `${API_UR}${url}`;

      // Add cache busting parameter
      const cacheBusterUrl = `${fullUrl}?t=${Date.now()}`;

      const response = await fetch(cacheBusterUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Verify content type
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/pdf")) {
        throw new Error("Invalid content type - expected PDF");
      }

      // Create blob and download
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "document_signed.pdf";
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
      }, 100);
    } catch (error) {
      console.error("Download failed:", error);
      alert(`Download failed: ${error.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await fetch("${API_UR}/api/signatures");
        const data = await res.json();
        setDocuments(data);
      } catch (err) {
        console.error("Error fetching documents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-2" />
              <span className="text-xl font-semibold text-gray-900">
                DocuSign Clone
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Templates
              </button>
              <button className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back!
          </h1>
          <p className="text-gray-600">
            Create, send, and manage your documents with ease.
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div
            onClick={onUploadDocument}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 cursor-pointer border border-gray-200 hover:border-blue-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Upload Document
              </h3>
              <p className="text-gray-600 text-sm">
                Upload an existing document and add signature fields
              </p>
            </div>
          </div>

          <div
            onClick={onChooseTemplate}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 cursor-pointer border border-gray-200 hover:border-green-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Choose Template
              </h3>
              <p className="text-gray-600 text-sm">
                Select from our library of pre-made templates
              </p>
            </div>
          </div>

          <div
            onClick={onCreateFromScratch}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 cursor-pointer border border-gray-200 hover:border-purple-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Create from Scratch
              </h3>
              <p className="text-gray-600 text-sm">
                Start with a blank document and build from scratch
              </p>
            </div>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Documents
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Your recently created and sent documents
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-gray-500">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="p-6 text-gray-500">No documents found.</div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc._id}
                  className="p-6 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(doc.status)}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {doc.documentTitle}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {doc.recipients.length} recipient
                          {doc.recipients.length !== 1 ? "s" : ""} •{" "}
                          {new Date(doc.sentAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          doc.status
                        )}`}
                      >
                        {doc.status}
                      </span>

                      <button className="text-gray-400 hover:text-gray-600 flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">View</span>
                      </button>

                      {doc.status === "completed" && doc.fileUrl && (
                        <button
                          onClick={() =>
                            downloadPDF(
                              doc.fileUrl,
                              `${doc.documentTitle}_signed.pdf`
                            )
                          }
                          className="text-blue-600 text-sm font-medium hover:underline flex items-center"
                          disabled={!doc.fileUrl}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
