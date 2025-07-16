import React, { useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';

interface CreateFromScratchProps {
  onBack: () => void;
  onContinue: (documentData: { title: string; content: string }) => void;
}

const CreateFromScratch: React.FC<CreateFromScratchProps> = ({ onBack, onContinue }) => {
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentContent, setDocumentContent] = useState('');

  const handleContinue = () => {
    if (documentTitle.trim() && documentContent.trim()) {
      onContinue({
        title: documentTitle,
        content: documentContent
      });
    }
  };

  const isFormValid = documentTitle.trim() && documentContent.trim();

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
            <FileText className="w-6 h-6 text-blue-600 mr-2" />
            <span className="text-lg font-semibold text-gray-900">Create from Scratch</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="px-8 py-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create from Scratch</h1>
            <p className="text-gray-600">Start with a blank document and build your content from scratch.</p>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Details</h2>
              <p className="text-gray-600">Enter the basic information for your new document.</p>
            </div>

            <div className="space-y-6">
              {/* Document Title */}
              <div>
                <label htmlFor="document-title" className="block text-sm font-medium text-gray-700 mb-2">
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

              {/* Document Content */}
              <div>
                <label htmlFor="document-content" className="block text-sm font-medium text-gray-700 mb-2">
                  Document Content
                </label>
                <textarea
                  id="document-content"
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  placeholder="Start typing your document content here..."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed resize-none"
                />
                <p className="mt-2 text-sm text-gray-500">
                  You can add signature fields and format the document in the next step.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={onBack}
              className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!isFormValid}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isFormValid
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue to Editor
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for creating your document:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use placeholders like [NAME], [DATE], [COMPANY] for fields that recipients will fill</li>
            <li>• Keep your content clear and well-structured</li>
            <li>• You'll be able to add signature fields, date fields, and other form elements in the next step</li>
            <li>• The document can be edited and refined after creation</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default CreateFromScratch;