'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, FileCode } from 'lucide-react';

interface FileUploadAreaProps {
  onFileSelected: (file: File | null) => void;
  selectedFile: File | null;
  maxSizeBytes?: number; // default 50 MB
  accept?: string;
}

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = ['.fasta', '.fa', '.fna', '.csv'];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function FileUploadArea({
  onFileSelected,
  selectedFile,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  accept = '.fasta,.fa,.fna,.csv',
}: FileUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelectFile = (file: File) => {
    setErrorMessage(null);

    // Validate extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setErrorMessage(
        `Unsupported file type "${extension}". Please provide a FASTA (.fasta, .fa, .fna) or CSV sequence file.`
      );
      return;
    }

    // Validate size limit
    if (file.size > maxSizeBytes) {
      setErrorMessage(
        `File exceeds maximum client limit of ${formatBytes(maxSizeBytes)}. Selected: ${formatBytes(
          file.size
        )}.`
      );
      return;
    }

    onFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    onFileSelected(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        id="genome-file-input"
        aria-label="Upload genomic dataset file"
      />

      {/* Dropzone Container */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center ${
            isDragOver
              ? 'border-[#28D7FF] bg-[#28D7FF]/10 scale-[1.01]'
              : 'border-[#28D7FF]/30 hover:border-[#28D7FF]/60 bg-[#0B1026]/60 hover:bg-[#0B1026]/90'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#28D7FF]/15 to-[#8B5CF6]/25 border border-[#28D7FF]/30 flex items-center justify-center text-[#28D7FF] mb-4 shadow-[0_0_25px_rgba(40,215,255,0.2)]">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mb-1">
            Drag and drop genomic dataset here
          </h3>

          <p className="text-xs sm:text-sm text-[#A7B1C8] max-w-sm mb-4">
            Supports standardized <span className="text-[#28D7FF] font-mono">FASTA</span> (.fasta, .fa, .fna) and{' '}
            <span className="text-[#C084FC] font-mono">CSV</span> sequence matrices up to 50MB.
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] hover:opacity-95 shadow-[0_0_20px_rgba(40,215,255,0.3)] transition-all cursor-pointer"
          >
            Browse Files
          </button>
        </div>
      ) : (
        /* Selected File Card */
        <div className="rounded-2xl glass-panel p-5 border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight break-all">
                  {selectedFile.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedFile.name.split('.').pop()}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#A7B1C8] mt-1 font-mono">
                <span>{formatBytes(selectedFile.size)}</span>
                <span>&bull;</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Validated Client-Side
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#28D7FF] bg-[#28D7FF]/10 border border-[#28D7FF]/30 hover:bg-[#28D7FF]/20 transition-all cursor-pointer"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1.5 rounded-lg text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-all cursor-pointer"
              aria-label="Remove selected file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Validation Error Message */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
