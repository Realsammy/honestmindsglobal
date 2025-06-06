'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

interface SystemConfig {
  site_name: string
  site_url: string
  maintenance_mode: boolean
  registration_enabled: boolean
  default_currency: string
  timezone: string
  date_format: string
  max_file_size: number
  allowed_file_types: string[]
}

export function SystemConfig({ config }: { config: SystemConfig }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(config)
  const router = useRouter()
  const { toast } = useToast()

  const updateConfig = async () => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('system_config')
        .update(formData)
        .eq('id', 1)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'System configuration updated successfully',
        type: 'success'
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update system configuration',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Site Name</label>
            <Input
              value={formData.site_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, site_name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Site URL</label>
            <Input
              value={formData.site_url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, site_url: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Default Currency</label>
            <Input
              value={formData.default_currency}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  default_currency: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Timezone</label>
            <Input
              value={formData.timezone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, timezone: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Date Format</label>
            <Input
              value={formData.date_format}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  date_format: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Max File Size (MB)</label>
            <Input
              type="number"
              value={formData.max_file_size}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  max_file_size: parseInt(e.target.value),
                }))
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Maintenance Mode</label>
            <Switch
              checked={formData.maintenance_mode}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  maintenance_mode: checked,
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Enable Registration</label>
            <Switch
              checked={formData.registration_enabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  registration_enabled: checked,
                }))
              }
            />
          </div>
        </div>
        <Button onClick={updateConfig} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  )
}
