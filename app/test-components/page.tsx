import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

export default function TestComponentsPage() {
  return (
    <div className="min-h-screen relative">
      {/* Grass court background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{ backgroundImage: 'url(/grass-court.jpg)' }}
      />
      {/* Semi-transparent overlay for readability */}
      <div className="fixed inset-0 bg-white/75 -z-10" />

      <div className="container mx-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#2E1A47' }}>
              shadcn/ui Component Test
            </h1>
            <p className="text-gray-600">
              Testing shadcn components with Wimbledon theme integration
            </p>
            <Link href="/dashboard" className="text-sm text-primary hover:underline mt-2 inline-block">
              ← Back to Dashboard
            </Link>
          </div>

          {/* Buttons Test */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>
                Testing button variants with Wimbledon purple primary color
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4 flex-wrap">
              <Button>Primary (Wimbledon Purple)</Button>
              <Button variant="secondary">Secondary (Wimbledon Green)</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Primary button should use Wimbledon purple (#2E1A47)
              </p>
            </CardFooter>
          </Card>

          {/* Badges Test */}
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Status indicators and labels</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4 flex-wrap items-center">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <div className="flex items-center gap-2">
                <Badge>🏆 Seed 1</Badge>
                <Badge variant="secondary">Open</Badge>
                <Badge variant="outline">Used</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Form Elements Test */}
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>Input fields with purple focus rings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Player Name</Label>
                <Input id="name" placeholder="Enter player name" />
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Focus rings should be Wimbledon purple
              </p>
            </CardFooter>
          </Card>

          {/* Alerts Test */}
          <div className="space-y-4">
            <Alert>
              <AlertTitle>Default Alert</AlertTitle>
              <AlertDescription>
                This is a standard alert message with default styling.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Invalid email or password. Please try again.
              </AlertDescription>
            </Alert>
          </div>

          {/* Card Variations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Card One</CardTitle>
                <CardDescription>First card example</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">This is card content with proper spacing and typography.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Card Two</CardTitle>
                <CardDescription>Second card example</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Testing multiple cards in a grid layout.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Card Three</CardTitle>
                <CardDescription>Third card example</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">All cards should have consistent styling.</p>
              </CardContent>
            </Card>
          </div>

          {/* Color Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Wimbledon Color Reference</CardTitle>
              <CardDescription>Official Wimbledon colors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="h-20 rounded-lg" style={{ backgroundColor: '#2E1A47' }}></div>
                  <p className="text-xs mt-2 font-medium">Purple</p>
                  <p className="text-xs text-muted-foreground">#2E1A47</p>
                </div>
                <div>
                  <div className="h-20 rounded-lg" style={{ backgroundColor: '#006633' }}></div>
                  <p className="text-xs mt-2 font-medium">Green</p>
                  <p className="text-xs text-muted-foreground">#006633</p>
                </div>
                <div>
                  <div className="h-20 rounded-lg" style={{ backgroundColor: '#007A3D' }}></div>
                  <p className="text-xs mt-2 font-medium">Green Light</p>
                  <p className="text-xs text-muted-foreground">#007A3D</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
