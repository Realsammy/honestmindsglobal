'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { Progress } from '@/components/ui/Progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'

interface ValidationResult {
  table: string
  total_records: number
  valid_records: number
  invalid_records: number
  errors: {
    field: string
    message: string
    count: number
  }[]
}

export function DataValidation() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<ValidationResult[]>([])
  const router = useRouter()
  const { toast } = useToast()

  const validateData = async () => {
    try {
      setLoading(true)
      setProgress(0)

      const { data, error } = await supabase.functions.invoke('validate-data', {
        body: { type: 'full' },
      })

      if (error) throw error

      setResults(data.results)
      toast({
        title: 'Success',
        description: 'Data validation completed successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to validate data',
        type: 'error'
      })
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const fixIssues = async (table: string) => {
    try {
      setLoading(true)
      setProgress(0)

      const { error } = await supabase.functions.invoke('fix-data-issues', {
        body: { table },
      })

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Data issues fixed successfully',
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fix data issues',
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
        <CardTitle>Data Validation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={validateData} disabled={loading}>
          {loading ? 'Validating...' : 'Validate Data'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.table} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{result.table}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">
                      Total: {result.total_records}
                    </Badge>
                    <Badge
                      variant={
                        result.valid_records === result.total_records
                          ? 'success'
                          : 'warning'
                      }
                    >
                      Valid: {result.valid_records}
                    </Badge>
                    <Badge
                      variant={
                        result.invalid_records > 0 ? 'destructive' : 'success'
                      }
                    >
                      Invalid: {result.invalid_records}
                    </Badge>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.errors.map((error) => (
                        <TableRow key={`${result.table}-${error.field}`}>
                          <TableCell>{error.field}</TableCell>
                          <TableCell>{error.message}</TableCell>
                          <TableCell>{error.count}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fixIssues(result.table)}
                              disabled={loading}
                            >
                              Fix Issues
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ))}
          </div>
        )}

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
