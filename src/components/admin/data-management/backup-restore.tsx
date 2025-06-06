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
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'

interface Backup {
  id: string
  filename: string
  size: number
  status: string
  created_at: string
  completed_at: string | null
}

export function BackupRestore({ backups }: { backups: Backup[] }) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const createBackup = async () => {
    try {
      setLoading(true)
      setProgress(0)

      const { error } = await supabase.functions.invoke('create-backup', {
        body: { type: 'full' },
      })

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Backup started successfully',
        type: 'success'
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create backup',
        type: 'error'
      })
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const restoreBackup = async (backup: Backup) => {
    setSelectedBackup(backup)
    setShowConfirmDialog(true)
  }

  const confirmRestore = async () => {
    if (!selectedBackup) return

    try {
      setLoading(true)
      setProgress(0)

      const { error } = await supabase.functions.invoke('restore-backup', {
        body: { backupId: selectedBackup.id },
      })

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Backup restored successfully',
        type: 'success'
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore backup',
        type: 'error'
      })
    } finally {
      setLoading(false)
      setProgress(0)
      setShowConfirmDialog(false)
      setSelectedBackup(null)
    }
  }

  const downloadBackup = async (backup: Backup) => {
    try {
      setLoading(true)

      const { data, error } = await supabase.storage
        .from('backups')
        .download(backup.filename)

      if (error) throw error

      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = backup.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success',
        description: 'Backup downloaded successfully',
        type: 'success'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download backup',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup & Restore</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={createBackup} disabled={loading}>
          {loading ? 'Creating Backup...' : 'Create Backup'}
        </Button>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backups.map((backup) => (
              <TableRow key={backup.id}>
                <TableCell>{backup.filename}</TableCell>
                <TableCell>{(backup.size / 1024 / 1024).toFixed(2)} MB</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      backup.status === 'completed'
                        ? 'success'
                        : backup.status === 'failed'
                        ? 'destructive'
                        : 'warning'
                    }
                  >
                    {backup.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(backup.created_at), 'PPpp')}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadBackup(backup)}
                      disabled={loading || backup.status !== 'completed'}
                    >
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => restoreBackup(backup)}
                      disabled={loading || backup.status !== 'completed'}
                    >
                      Restore
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

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

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Restore</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Are you sure you want to restore this backup? This will overwrite
                all current data.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmRestore}
                  disabled={loading}
                >
                  {loading ? 'Restoring...' : 'Restore'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
