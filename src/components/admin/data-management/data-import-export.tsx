'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { Progress } from '@/components/ui/Progress'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Badge } from '@/components/ui/Badge'

const TABLES = [
  'profiles',
  'posts',
  'comments',
  'likes',
  'follows',
  'notifications',
  'settings',
]

export function DataImportExport() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [importFile, setImportFile] = useState<File | null>(null)
  const [exportFormat, setExportFormat] = useState('json')
  const router = useRouter()
  const { toast } = useToast()

  const handleImport = async () => {
    if (!importFile) return

    try {
      setLoading(true)
      setProgress(0)

      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('tables', JSON.stringify(selectedTables))

      const response = await fetch('/api/admin/import-data', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Import failed')

      const data = await response.json()

      toast({
        title: 'Success',
        description: 'Data imported successfully',
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to import data',
        type: 'error'
      })
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const handleExport = async () => {
    if (selectedTables.length === 0) return

    try {
      setLoading(true)
      setProgress(0)

      const response = await fetch('/api/admin/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tables: selectedTables,
          format: exportFormat,
        }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-${new Date().toISOString()}.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success',
        description: 'Data exported successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        type: 'error'
      })
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Import/Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Tables</label>
          <ScrollArea className="h-[100px] rounded-md border p-2">
            <div className="space-y-2">
              {TABLES.map((table) => (
                <div key={table} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={table}
                    checked={selectedTables.includes(table)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTables([...selectedTables, table])
                      } else {
                        setSelectedTables(
                          selectedTables.filter((t) => t !== table)
                        )
                      }
                    }}
                  />
                  <label htmlFor={table} className="text-sm">
                    {table}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Import Data</label>
            <div className="mt-2">
              <Input
                type="file"
                accept=".json,.csv"
                onChange={(e) =>
                  setImportFile(e.target.files ? e.target.files[0] : null)
                }
              />
            </div>
            <Button
              onClick={handleImport}
              disabled={loading || !importFile}
              className="mt-2"
            >
              {loading ? 'Importing...' : 'Import Data'}
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium">Export Format</label>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </Select>
            <Button
              onClick={handleExport}
              disabled={loading || selectedTables.length === 0}
              className="mt-2"
            >
              {loading ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-gray-500">
              {progress === 0
                ? 'Preparing...'
                : progress === 100
                ? 'Complete'
                : `Processing... ${progress}%`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
