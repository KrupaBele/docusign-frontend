import React, { useState, useRef, useEffect } from 'react';
import { X, Pen, Type, Upload, Save, Trash2 } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: SavedSignature) => void;
  existingSignatures: SavedSignature[];
}

export interface SavedSignature {
  id: string;
  name: string;
  type: 'draw' | 'type' | 'upload';
  data: string; // base64 for drawn/uploaded, text for typed
  createdAt: string;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  existingSignatures 
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload' | 'saved'>('saved');
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedSignature, setTypedSignature] = useState('');
  const [selectedFont, setSelectedFont] = useState('cursive');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const saveDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Create transparent background signature
      const dataURL = canvas.toDataURL('image/png');
      const signature: SavedSignature = {
        id: Date.now().toString(),
        name: `Drawn Signature ${new Date().toLocaleDateString()}`,
        type: 'draw',
        data: dataURL,
        createdAt: new Date().toISOString()
      };
      onSave(signature);
    }
  };

  const saveTypedSignature = () => {
    if (typedSignature.trim()) {
      const signature: SavedSignature = {
        id: Date.now().toString(),
        name: `Typed Signature: ${typedSignature}`,
        type: 'type',
        data: JSON.stringify({ text: typedSignature, font: selectedFont }),
        createdAt: new Date().toISOString()
      };
      onSave(signature);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const signature: SavedSignature = {
          id: Date.now().toString(),
          name: `Uploaded Signature: ${file.name}`,
          type: 'upload',
          data: event.target?.result as string,
          createdAt: new Date().toISOString()
        };
        onSave(signature);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderSignature = (signature: SavedSignature) => {
    switch (signature.type) {
      case 'draw':
      case 'upload':
        return (
          <img 
            src={signature.data} 
            alt="Signature" 
            className="max-w-full max-h-16 object-contain"
          />
        );
      case 'type':
        const { text, font } = JSON.parse(signature.data);
        return (
          <div 
            className="text-2xl"
            style={{ fontFamily: font }}
          >
            {text}
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Manage Signatures</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'saved'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Saved Signatures
            </button>
            <button
              onClick={() => setActiveTab('draw')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'draw'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Pen className="w-4 h-4 inline mr-2" />
              Draw
            </button>
            <button
              onClick={() => setActiveTab('type')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'type'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Type className="w-4 h-4 inline mr-2" />
              Type
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload
            </button>
          </div>

          {/* Saved Signatures Tab */}
          {activeTab === 'saved' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Saved Signatures</h3>
              {existingSignatures.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Pen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No signatures saved yet.</p>
                  <p className="text-sm">Create your first signature using the tabs above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {existingSignatures.map((signature) => (
                    <div
                      key={signature.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
                      onClick={() => onSave(signature)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {signature.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle delete signature
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="bg-gray-50 rounded p-3 flex items-center justify-center min-h-[60px]">
                        {renderSignature(signature)}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Created {new Date(signature.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Draw Tab */}
          {activeTab === 'draw' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Draw Your Signature</h3>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={200}
                  className="border border-gray-200 bg-white rounded cursor-crosshair w-full"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Draw your signature above. The background will be transparent when placed on the document.
                </p>
                <div className="flex justify-between mt-4">
                  <button
                    onClick={clearCanvas}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
                  >
                    Clear
                  </button>
                  <button
                    onClick={saveDrawnSignature}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Signature
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Type Tab */}
          {activeTab === 'type' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Type Your Signature</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your name
                  </label>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose font style
                  </label>
                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cursive">Cursive</option>
                    <option value="serif">Serif</option>
                    <option value="sans-serif">Sans Serif</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>

                {typedSignature && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <div 
                      className="text-3xl text-center py-4 bg-white rounded border"
                      style={{ fontFamily: selectedFont }}
                    >
                      {typedSignature}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 This signature will appear with transparent background on your document.
                    </p>
                  </div>
                )}

                <button
                  onClick={saveTypedSignature}
                  disabled={!typedSignature.trim()}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Signature
                </button>
              </div>
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Signature Image</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">
                  Upload an image of your signature
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  💡 For best results, use a PNG with transparent background or a clear signature on white background.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Choose File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;