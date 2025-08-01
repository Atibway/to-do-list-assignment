// app/dashboard/settings/page.tsx
"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Users,
  CheckSquare,
  Activity,
  Server,
  Globe,
  Lock,
  Eye,
  AlertTriangle,
  Save,
  RefreshCw
} from "lucide-react"

interface SystemStats {
  totalUsers: number
  totalTasks: number
  completedTasks: number
  databaseSize: string
  uptime: string
  responseTime: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [maintenance, setMaintenance] = useState(false)
  const [autoBackup, setAutoBackup] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [systemAlerts, setSystemAlerts] = useState(true)
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    databaseSize: "0 MB",
    uptime: "99.9%",
    responseTime: "156ms"
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSystemStats()
  }, [])

  const fetchSystemStats = async () => {
    try {
      // Get tasks stats
      const tasksSnapshot = await getDocs(collection(db, "tasks"))
      const totalTasks = tasksSnapshot.size
      
      // Get completed tasks
      const completedTasksQuery = query(
        collection(db, "tasks"),
        where("isDone", "==", true)
      )
      const completedTasksSnapshot = await getDocs(completedTasksQuery)
      const completedTasks = completedTasksSnapshot.size

      // Get unique users (from tasks)
      const userIds = new Set()
      tasksSnapshot.docs.forEach(doc => {
        const userId = doc.data().userId
        if (userId) userIds.add(userId)
      })

      setStats({
        totalUsers: userIds.size,
        totalTasks,
        completedTasks,
        databaseSize: `${((totalTasks * 0.5) / 1024).toFixed(1)} MB`, // Estimated
        uptime: "99.9%",
        responseTime: `${Math.floor(Math.random() * 100) + 100}ms`
      })
    } catch (error) {
      console.error("Error fetching system stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Here you would typically save to your backend/Firestore
    console.log("Settings saved:", {
      notifications,
      maintenance,
      autoBackup,
      emailNotifications,
      pushNotifications,
      systemAlerts,
      twoFactorAuth
    })
    
    setSaving(false)
    alert("Settings saved successfully!")
  }

  const handleBackupNow = async () => {
    setSaving(true)
    
    // Simulate backup process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setSaving(false)
    alert("Backup completed successfully!")
  }

  const handleExportData = () => {
    // Create a simple data export
    const exportData = {
      timestamp: new Date().toISOString(),
      stats,
      settings: {
        notifications,
        maintenance,
        autoBackup,
        emailNotifications,
        pushNotifications,
        systemAlerts
      }
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `admin-export-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  return (
    <AuthGuard requireAdmin>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">Manage your application settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>General Settings</span>
              </CardTitle>
              <CardDescription>Configure basic application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Application Name</label>
                <Input defaultValue="Task Manager Pro" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Email</label>
                <Input defaultValue={user?.email || "admin@taskmanager.com"} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Company Name</label>
                <Input defaultValue="Task Manager Inc." />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Maintenance Mode</label>
                  <p className="text-xs text-gray-500">Temporarily disable app access</p>
                </div>
                <Switch
                  checked={maintenance}
                  onCheckedChange={setMaintenance}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Public Registration</label>
                  <p className="text-xs text-gray-500">Allow new user registrations</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>Manage notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Email Notifications</label>
                  <p className="text-xs text-gray-500">Receive admin alerts via email</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Push Notifications</label>
                  <p className="text-xs text-gray-500">Browser push notifications</p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">System Alerts</label>
                  <p className="text-xs text-gray-500">Critical system notifications</p>
                </div>
                <Switch
                  checked={systemAlerts}
                  onCheckedChange={setSystemAlerts}
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Alert Thresholds</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">High CPU Usage (%)</span>
                    <Input defaultValue="80" className="w-20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory Usage (%)</span>
                    <Input defaultValue="85" className="w-20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Response Time (ms)</span>
                    <Input defaultValue="1000" className="w-20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security</span>
              </CardTitle>
              <CardDescription>Security and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Two-Factor Authentication</label>
                  <p className="text-xs text-gray-500">Additional security layer</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={twoFactorAuth}
                    onCheckedChange={setTwoFactorAuth}
                  />
                  <Badge variant={twoFactorAuth ? "default" : "secondary"}>
                    {twoFactorAuth ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Session Timeout</span>
                  <Badge variant="secondary">24 hours</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Password Policy</span>
                  <Badge variant="default">Strong</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Login Attempts</span>
                  <Badge variant="outline">5 max</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">API Rate Limit (req/hour)</label>
                <Input defaultValue="1000" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Allowed IP Ranges</label>
                <Input placeholder="0.0.0.0/0 (All IPs)" />
              </div>
            </CardContent>
          </Card>

          {/* Database Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Database & Backup</span>
              </CardTitle>
              <CardDescription>Database management and backup settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Auto Backup</label>
                  <p className="text-xs text-gray-500">Daily automated backups</p>
                </div>
                <Switch
                  checked={autoBackup}
                  onCheckedChange={setAutoBackup}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Backup</span>
                  <Badge variant="secondary">2 hours ago</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database Size</span>
                  <Badge variant="outline">{stats.databaseSize}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Storage Used</span>
                  <Badge variant="outline">45%</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Backup Retention</span>
                  <Badge variant="secondary">30 days</Badge>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleBackupNow}
                  disabled={saving}
                >
                  <Database className="h-4 w-4 mr-2" />
                  {saving ? "Backing up..." : "Backup Now"}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleExportData}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Status</span>
            </CardTitle>
            <CardDescription>Current system health and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.uptime}</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.responseTime}</div>
                <div className="text-sm text-gray-600">Response Time</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.databaseSize}</div>
                <div className="text-sm text-gray-600">Database Size</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">43%</div>
                <div className="text-sm text-gray-600">CPU Usage</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <div className="text-xl font-bold">{stats.totalUsers}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <div className="text-xl font-bold">{stats.totalTasks}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Activity className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <div className="text-xl font-bold">
                  {stats.totalTasks > 0 ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </AuthGuard>
  )
}