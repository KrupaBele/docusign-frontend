import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./components/Dashboard";
import TemplateLibrary from "./components/TemplateLibrary";
import DocumentEditor from "./components/DocumentEditor";
import CreateFromScratch from "./components/CreateFromScratch";
import DocumentUploader from "./components/DocumentUploader";
import SignDocumentPage from "./components/SignDocumentPage";
import { Document, Template } from "./types";

function App() {
  const [currentView, setCurrentView] = useState<
    "dashboard" | "templates" | "editor" | "create" | "upload"
  >("dashboard");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      title: "Employment Contract",
      recipients: 2,
      status: "completed",
      date: "2024-01-15",
      templateId: "employment-contract",
    },
    {
      id: "2",
      title: "NDA Agreement",
      recipients: 1,
      status: "pending",
      date: "2024-01-14",
      templateId: "nda-agreement",
    },
  ]);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setCurrentView("editor");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedTemplate(null);
  };

  const handleBackToTemplates = () => {
    setCurrentView("templates");
    setSelectedTemplate(null);
  };

  const handleCreateFromScratch = () => {
    setCurrentView("create");
  };

  const handleUploadDocument = () => {
    setCurrentView("upload");
  };

  const handleContinueFromScratch = (documentData: {
    title: string;
    content: string;
  }) => {
    setSelectedTemplate({
      id: "custom-" + Date.now(),
      title: documentData.title,
      category: "Custom",
      description: "Custom document created from scratch",
      content: documentData.content,
    });
    setCurrentView("editor");
  };

  const handleContinueFromUpload = (documentData: {
    title: string;
    content: string;
    fileUrl?: string;
    fileType?: string;
  }) => {
    setSelectedTemplate({
      id: "uploaded-" + Date.now(),
      title: documentData.title,
      category: "Uploaded",
      description: "Document uploaded from file",
      content: documentData.content,
      fileUrl: documentData.fileUrl,
      fileType: documentData.fileType,
    });
    setCurrentView("editor");
  };

  return (
    <Router>
      <Routes>
        {/* Main app routes (internal views controlled by state) */}
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gray-50">
              {currentView === "dashboard" && (
                <Dashboard
                  documents={documents}
                  onChooseTemplate={() => setCurrentView("templates")}
                  onCreateFromScratch={handleCreateFromScratch}
                  onUploadDocument={handleUploadDocument}
                />
              )}

              {currentView === "create" && (
                <CreateFromScratch
                  onBack={handleBackToDashboard}
                  onContinue={handleContinueFromScratch}
                />
              )}

              {currentView === "upload" && (
                <DocumentUploader
                  onBack={handleBackToDashboard}
                  onContinue={handleContinueFromUpload}
                />
              )}

              {currentView === "templates" && (
                <TemplateLibrary
                  onSelectTemplate={handleTemplateSelect}
                  onBackToDashboard={handleBackToDashboard}
                />
              )}

              {currentView === "editor" && selectedTemplate && (
                <DocumentEditor
                  template={selectedTemplate}
                  onBack={
                    (selectedTemplate.category === "Custom" &&
                      selectedTemplate.id.startsWith("custom-")) ||
                    (selectedTemplate.category === "Uploaded" &&
                      selectedTemplate.id.startsWith("uploaded-"))
                      ? handleBackToDashboard
                      : handleBackToTemplates
                  }
                  mode={
                    selectedTemplate.id.startsWith("custom-")
                      ? "create"
                      : selectedTemplate.id.startsWith("uploaded-")
                      ? "upload"
                      : "template"
                  }
                />
              )}
            </div>
          }
        />

        {/* ✅ Recipient Sign Page */}
        <Route path="/sign/:id" element={<SignDocumentPage />} />
      </Routes>
    </Router>
  );
}

export default App;
