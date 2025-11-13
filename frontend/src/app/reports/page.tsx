'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  BookOpen,
  Search,
  Settings,
  RefreshCw,
  FileSpreadsheet,
  FileImage,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'

interface ReportTemplate {
  template_id: string
  name: string
  description: string
  report_type: string
  default_filters: any
  available_formats: string[]
}

interface ReportRequest {
  report_type: string
  date_range?: {
    start: string
    end: string
  }
  filters?: any
  include_charts: boolean
  format: string
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [reportHistory, setReportHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  })
  const [includeCharts, setIncludeCharts] = useState(true)
  const [reportFormat, setReportFormat] = useState('pdf')

  useEffect(() => {
    loadTemplates()
    loadReportHistory()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/reports/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
        if (data.length > 0) {
          setSelectedTemplate(data[0])
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const loadReportHistory = async () => {
    try {
      const response = await fetch('/api/reports/history')
      if (response.ok) {
        const data = await response.json()
        setReportHistory(data.reports)
      }
    } catch (error) {
      console.error('Failed to load report history:', error)
    }
  }

  const generateReport = async () => {
    if (!selectedTemplate) return

    setGenerating(true)
    try {
      const request: ReportRequest = {
        report_type: selectedTemplate.report_type,
        date_range: dateRange,
        include_charts: includeCharts,
        format: reportFormat
      }

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (response.ok) {
        const data = await response.json()
        // Trigger download
        downloadReport(data.content, data.report_id, reportFormat)
        // Refresh history
        loadReportHistory()
      } else {
        console.error('Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setGenerating(false)
    }
  }

  const downloadReport = (content: string, reportId: string, fileFormat: string) => {
    try {
      // Decode base64 content
      const byteCharacters = atob(content)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], {
        type:
          fileFormat === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${reportId}.${fileFormat}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading report:', error)
    }
  }

  const previewReport = async (template: ReportTemplate) => {
    try {
      const response = await fetch(`/api/reports/preview/${template.report_type}?format=pdf`)
      if (response.ok) {
        const data = await response.json()
        console.log('Preview data:', data)
        // In a real implementation, show preview modal
      }
    } catch (error) {
      console.error('Failed to preview report:', error)
    }
  }

  const getTemplateIcon = (reportType: string) => {
    switch (reportType) {
      case 'overview':
        return <BarChart3 className="h-5 w-5" />
      case 'analytics':
        return <TrendingUp className="h-5 w-5" />
      case 'works':
        return <BookOpen className="h-5 w-5" />
      case 'search':
        return <Search className="h-5 w-5" />
      case 'trends':
        return <TrendingUp className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getTemplateColor = (reportType: string) => {
    switch (reportType) {
      case 'overview':
        return 'bg-blue-100 text-blue-800'
      case 'analytics':
        return 'bg-green-100 text-green-800'
      case 'works':
        return 'bg-purple-100 text-purple-800'
      case 'search':
        return 'bg-orange-100 text-orange-800'
      case 'trends':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to access reporting features</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-green-600" />
            Advanced Reporting
          </h1>
          <p className="mt-2 text-gray-600">
            Generate comprehensive PDF and Excel reports with data visualization
          </p>
        </div>
        <Button onClick={loadReportHistory} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Generate Report Tab */}
        <TabsContent value="generate" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Report Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
                <CardDescription>
                  Configure your report settings and parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template">Report Template</Label>
                  <Select
                    value={selectedTemplate?.template_id || undefined}
                    onValueChange={(value) => {
                      const template = templates.find(t => t.template_id === value)
                      setSelectedTemplate(template || null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a report template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.template_id} value={template.template_id}>
                          <div className="flex items-center gap-2">
                            {getTemplateIcon(template.report_type)}
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="format">Export Format</Label>
                  <Select value={reportFormat} onValueChange={setReportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          PDF Report
                        </div>
                      </SelectItem>
                      <SelectItem value="excel">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          Excel Workbook
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-charts"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="include-charts">Include charts and visualizations</Label>
                </div>

                {selectedTemplate && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{selectedTemplate.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{selectedTemplate.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getTemplateColor(selectedTemplate.report_type)}>
                        {selectedTemplate.report_type}
                      </Badge>
                      {selectedTemplate.available_formats.map((availableFormat) => (
                        <Badge key={availableFormat} variant="outline">
                          {availableFormat.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={generateReport}
                  disabled={!selectedTemplate || generating}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Report Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Report Preview</CardTitle>
                <CardDescription>
                  Preview of the selected report template
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <div className="space-y-4">
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        {getTemplateIcon(selectedTemplate.report_type)}
                        <p className="mt-2 text-sm text-gray-600">
                          {selectedTemplate.name} Preview
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => previewReport(selectedTemplate)}
                      className="w-full"
                    >
                      <FileImage className="h-4 w-4 mr-2" />
                      Preview Report
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Select a template to preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>
                Available report templates with different configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.template_id}
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate?.template_id === template.template_id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {getTemplateIcon(template.report_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge className={getTemplateColor(template.report_type)}>
                              {template.report_type}
                            </Badge>
                            {template.available_formats.map((availableFormat) => (
                              <Badge key={availableFormat} variant="outline" className="text-xs">
                                {availableFormat.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>
                Previously generated reports and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Generate your first report to see it here
                  </p>
                  <Button onClick={() => loadReportHistory()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {reportHistory.map((report) => (
                    <Card key={report.report_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(report.status)}
                            <div>
                              <h4 className="font-medium text-gray-900 capitalize">
                                {report.report_type} Report
                              </h4>
                              <p className="text-sm text-gray-600">
                                Generated {format(new Date(report.generated_at), 'MMM d, yyyy HH:mm')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {report.date_range.start} to {report.date_range.end} • {report.format.toUpperCase()} • {report.file_size}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={report.status === 'completed' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {report.status}
                            </Badge>
                            {report.status === 'completed' && (
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
