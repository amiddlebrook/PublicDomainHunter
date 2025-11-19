'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  FileText,
  BookOpen,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { API_BASE_URL } from '@/lib/utils'

interface UploadResponse {
  message: string
  work_id: number
  work_title: string
  metadata: any
}

export default function UploadPage() {
  const { user } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<UploadResponse | null>(null)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['application/epub+zip', 'application/pdf']
    const allowedExtensions = ['.epub', '.pdf']

    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)

    if (!isValidType) {
      setError('Please select a valid EPUB or PDF file.')
      return
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB.')
      return
    }

    setSelectedFile(file)
    setError('')
    setResult(null)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setProgress(0)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
        setProgress(100)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Upload failed')
      }
    } catch (error) {
      setError('Network error occurred during upload')
    } finally {
      setUploading(false)
    }
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setProgress(0)
    setError('')
    setResult(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">File Upload</h1>
        <p className="mt-2 text-gray-600">
          Upload EPUB or PDF files to automatically extract metadata and create public domain works.
        </p>
      </div>

      {/* Supported File Types Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Supported File Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <BookOpen className="h-8 w-8 text-blue-500" />
              <div>
                <div className="font-medium">EPUB Files</div>
                <div className="text-sm text-gray-600">Electronic Publication books</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <FileText className="h-8 w-8 text-red-500" />
              <div>
                <div className="font-medium">PDF Files</div>
                <div className="text-sm text-gray-600">Portable Document Format</div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Maximum file size:</strong> 50MB</p>
            <p><strong>Processing:</strong> Files are automatically processed to extract metadata, content, and generate insights.</p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="text-lg font-medium text-gray-900 mb-2">
                Drop your file here, or click to browse
              </div>
              <div className="text-gray-600 mb-4">
                Supports EPUB and PDF files up to 50MB
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".epub,.pdf,application/epub+zip,application/pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File Info */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {selectedFile.type === 'application/epub+zip' ? (
                    <BookOpen className="h-8 w-8 text-blue-500" />
                  ) : (
                    <FileText className="h-8 w-8 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-gray-600">
                      {formatFileSize(selectedFile.size)}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={resetUpload}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Upload Button */}
              {!uploading && (
                <div className="flex gap-2">
                  <Button onClick={handleUpload} className="flex-1">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload and Process
                  </Button>
                  <Button variant="outline" onClick={resetUpload}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              File Processed Successfully
            </CardTitle>
            <CardDescription>
              Your file has been processed and a work entry has been created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-gray-900">Work Created</h4>
                  <p className="text-gray-600">{result.work_title}</p>
                  <p className="text-sm text-gray-500">ID: {result.work_id}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Processing Results</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Words extracted: {result.metadata.content?.word_count || 'N/A'}</p>
                    <p>Language: {result.metadata.analysis?.detected_language || 'N/A'}</p>
                    <p>Content type: {result.metadata.analysis?.content_type || 'N/A'}</p>
                    <p>Reading time: {result.metadata.analysis?.readability_metrics?.estimated_reading_time_minutes || 0} min</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button asChild>
                  <Link href={`/works/${result.work_id}`}>
                    View Work Details
                  </Link>
                </Button>
                <Button variant="outline" onClick={resetUpload}>
                  Upload Another File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Upload Your File</h4>
                <p className="text-sm text-gray-600">Select an EPUB or PDF file from your computer</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Automatic Processing</h4>
                <p className="text-sm text-gray-600">Our system extracts metadata, text content, and analyzes the file</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Work Creation</h4>
                <p className="text-sm text-gray-600">A new work entry is created with all extracted information</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h4 className="font-medium">Ready to Use</h4>
                <p className="text-sm text-gray-600">Your work is now available with full analytics and insights</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
